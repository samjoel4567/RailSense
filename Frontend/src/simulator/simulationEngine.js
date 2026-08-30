/**
 * RAIL//AI Simulation Engine v3 — Fully Dynamic Multi-Page
 * - Continuous physics: positionKm += speed × Δt
 * - locoPilotDecide(trainId, 'PROCEED'|'HOLD') public API
 * - Real event log generated from state changes
 * - Signal engine integrated each tick
 * - All 4 pages share this single engine instance
 */

import { SimulationClock } from './simulationClock';
import { computeSimulationState } from './simulationState';
import { evaluateDeparture } from './safetyEvaluator';
import { SIMULATION_PHASES, TOTAL_PHASES } from './simulationConstants';
import { buildInitialTrains, cloneTrains, TRAIN_TYPE_CONFIG } from './trainModel';
import { SECTIONS, STATIONS, STATION_CHAIN, calculateRoute } from './networkModel';
import { buildInitialStationStates, updateStationStates, findAvailablePlatform } from './stationModel';
import { buildInitialSectionStates, updateSectionStates } from './sectionModel';
import { applyHeadwayConstraints } from './headwayEngine';
import { detectAllConflicts } from './conflictEngine';
import { predict as impactPredict } from './impactEngine';
import { recalculateAllETAs } from './etaEngine';
import { computeSignals, getEffectiveSpeedLimit } from './signalEngine';
import { predict as predictionPredict } from './predictionEngine';
import { mlPredictionProvider, ML_TRIGGER_EVENTS } from './MLPredictionProvider';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const TICK_MS           = 100;
const APPROACH_ZONE_PCT = 90;   // % into section when train begins decelerating
const MAX_EVENT_LOG     = 120;

export class SimulationEngine {
  constructor() {
    this.currentPhase    = 1;
    this.phaseProgress   = 0;
    this.clock           = new SimulationClock('14:20:00');
    this.speedMultiplier = 1;
    this.autoPlay        = false;
    this.listeners       = new Set();
    this.timerId         = null;
    this.loggedMilestones = new Set();

    // Hazard state
    this.hazardActive    = false;
    this.hazardSectionId = null;

    // Scenario state
    this.activeScenario  = null;
    this.baselineSnapshot = null;
    this.activeCabTrainId = 'LOCAL_101';

    // Loco Pilot decision state per train: 'IDLE' | 'WAITING' | 'HOLD' | 'PROCEED'
    this.locoPilotDecisions = {};

    // ── Initialize 30-train network ──────────────────────
    this._initNetwork();

    // ── Event log (generated from real state changes) ────
    this.eventLog = [];
    this._addEvent('SYSTEM', null, 'Multi-train network initialized — 30 trains active across A–J corridor');
    this._addEvent('SIGNALS', null, 'All 10 station interlocking systems online');

    this.state = this.buildState();

    // Start ML polling for the default cab train (LOCAL_101)
    // MLPredictionProvider checks connectivity first, then begins polling
    setTimeout(() => mlPredictionProvider.startPolling(this.activeCabTrainId), 500);
  }

  // ─────────────────────────────────────────────────────────
  // Network Initialization
  // ─────────────────────────────────────────────────────────
  _initNetwork() {
    this.trains = buildInitialTrains();

    // Fix dwelling trains
    this.trains.forEach(t => {
      if (t.status === 'STATION DWELL') {
        t.isDwelling    = true;
        t.currentStation = this._inferStation(t);
        t.currentSection = null;
        t.positionPct   = 0;
        t.speed         = 0;
        t.dwellTarget   = TRAIN_TYPE_CONFIG[t.type].defaultDwellSec;
        t.dwellTime     = 0;
      }
    });

    // Compute positionKm for all in-transit trains
    this.trains.forEach(t => { this._updatePositionKm(t); });

    // Loco Pilot: LOCAL_101 starts in WAITING state
    this.locoPilotDecisions['LOCAL_101'] = 'WAITING';

    this.stationStates = buildInitialStationStates(this.trains);
    this.sectionStates = buildInitialSectionStates(this.trains);
    this.signalStates  = computeSignals(this.trains, this.sectionStates, this.stationStates, false, null);

    this._refreshTrainETAs();
  }

  _inferStation(train) {
    if (STATIONS[train.currentSection]) return train.currentSection;
    if (train.origin && STATIONS[train.origin]) return train.origin;
    // Try to find via route position
    const sec = SECTIONS[train.currentSection];
    if (sec) {
      return train.direction === 'SOUTHBOUND' ? sec.fromStation : sec.toStation;
    }
    return train.origin;
  }

  _updatePositionKm(train) {
    if (train.isDwelling && train.currentStation) {
      const st = STATIONS[train.currentStation];
      train.positionKm = st ? st.kmPost : 0;
      return;
    }
    const sec = SECTIONS[train.currentSection];
    if (!sec) { train.positionKm = 0; return; }
    const fromSt = STATIONS[sec.fromStation];
    if (!fromSt) { train.positionKm = 0; return; }
    if (train.direction === 'SOUTHBOUND') {
      train.positionKm = fromSt.kmPost + (train.positionPct / 100) * sec.lengthKm;
    } else {
      const toSt = STATIONS[sec.toStation];
      train.positionKm = (toSt?.kmPost ?? 0) - (train.positionPct / 100) * sec.lengthKm;
    }
  }

  // ─────────────────────────────────────────────────────────
  // Event Logger (all events from real state changes)
  // ─────────────────────────────────────────────────────────
  _addEvent(type, trainId, message, delta = null) {
    const entry = {
      id: Date.now() + Math.random(),
      time: this.clock.getTimeString(),
      type,          // SYSTEM | DISPATCH | WARNING | CRITICAL | PHASE | DECISION | PREDICTION | SIGNALS
      trainId,
      message,
      delta,
      phase: this.currentPhase
    };
    this.eventLog = [entry, ...this.eventLog.slice(0, MAX_EVENT_LOG - 1)];
  }

  // ─────────────────────────────────────────────────────────
  // Subscriptions
  // ─────────────────────────────────────────────────────────
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.state = this.buildState();
    this.listeners.forEach(fn => { try { fn(this.state); } catch(e) { console.error(e); } });
  }

  // ─────────────────────────────────────────────────────────
  // State Builder
  // ─────────────────────────────────────────────────────────
  buildState() {
    const conflicts     = detectAllConflicts(this.trains, this.stationStates);
    const networkMetrics = this._computeNetworkMetrics(conflicts);
    const simTimeSec    = this._getSimTimeSec();

    // Build predictions for the active cab train
    const cabTrain = this.trains.find(t => t.id === this.activeCabTrainId);
    const cabPrediction = cabTrain
      ? predictionPredict(cabTrain, {
          trains: this.trains,
          stationStates: this.stationStates,
          sectionStates: this.sectionStates,
          simulationTimeSec: simTimeSec,
          signalStates: this.signalStates
        })
      : null;

    return computeSimulationState({
      phase:            this.currentPhase,
      phaseProgress:    this.phaseProgress,
      simTime:          this.clock.getTimeString(),
      simTimeSec,
      activeCabTrainId: this.activeCabTrainId,
      // Legacy kinematic shadows (preserved for backward compat)
      trainKinematics:  this._buildLegacyKinematics(),
      // Multi-train network state
      allTrains:        this.trains,
      stationStates:    this.stationStates,
      sectionStates:    this.sectionStates,
      signalStates:     this.signalStates,
      conflicts,
      networkMetrics,
      activeScenario:   this.activeScenario,
      baselineSnapshot: this.baselineSnapshot,
      eventLog:         this.eventLog,
      // Loco Pilot live data
      cabTrain,
      cabPrediction,
      locoPilotDecisions: { ...this.locoPilotDecisions },
      departureEvaluation: this._buildDepartureEval()
    });
  }

  _buildLegacyKinematics() {
    const mk = (id) => {
      const t = this.trains.find(x => x.id === id);
      if (!t) return null;
      return {
        id: t.id,
        departureState: t.isDwelling
          ? (t.delay > 0 || this.locoPilotDecisions[t.id] === 'HOLD' ? 'WAITING' : 'WAITING')
          : (t.hasReachedDestination ? 'ARRIVED' : 'DEPARTED'),
        progressPct:       t.positionPct || 0,
        speed:             t.speed,
        targetSpeed:       t.targetSpeed,
        initialDelayMinutes: t.delay || 0,
        dwellSeconds:      t.dwellTime || 0,
        distanceTraversedKm: this._getDistTraversed(t),
        distanceRemainingKm: this._getDistRemaining(t),
        status:            t.status
      };
    };
    return {
      local101:   mk('LOCAL_101'),
      express201: mk('EXPRESS_201'),
      local102:   mk('LOCAL_102'),
      express202: mk('EXPRESS_202')
    };
  }

  _buildDepartureEval() {
    const l101  = this.trains.find(t => t.id === 'LOCAL_101');
    const e201  = this.trains.find(t => t.id === 'EXPRESS_201');
    return evaluateDeparture({
      phase: this.currentPhase,
      trains: [l101, e201].filter(Boolean),
      hazardActive: this.hazardActive
    }, 'LOCAL_101');
  }

  _getSimTimeSec() {
    const [h, m, s] = this.clock.getTimeString().split(':').map(Number);
    return h * 3600 + m * 60 + (s || 0);
  }

  _getDistTraversed(t) {
    if (!t.currentSection) return 0;
    const sec = SECTIONS[t.currentSection];
    if (!sec) return 0;
    return parseFloat(((t.positionPct / 100) * sec.lengthKm).toFixed(2));
  }

  _getDistRemaining(t) {
    if (!t.currentSection) return 0;
    const sec = SECTIONS[t.currentSection];
    if (!sec) return 0;
    return parseFloat(((1 - t.positionPct / 100) * sec.lengthKm).toFixed(2));
  }

  _computeNetworkMetrics(conflicts) {
    const total       = this.trains.length;
    const atStation   = this.trains.filter(t => t.isDwelling).length;
    const inTransit   = total - atStation;
    const delayed     = this.trains.filter(t => (t.delay || 0) > 0).length;
    const constrained = this.trains.filter(t => t.headwayStatus === 'CONSTRAINED').length;
    const onTime      = Math.max(0, total - delayed - constrained);
    const avgDelay    = this.trains.reduce((a, t) => a + (t.delay || 0), 0) / total;
    const activeCritical = conflicts.filter(c => c.risk === 'CRITICAL' || c.risk === 'HIGH').length;

    const riskScore = Math.min(100, Math.round(
      (delayed / total)     * 30 +
      (constrained / total) * 25 +
      (activeCritical * 8)  +
      (this.hazardActive ? 30 : 0) +
      (this.currentPhase === 5 ? 15 : this.currentPhase === 4 ? 10 : 0)
    ));

    return {
      totalTrains:      total,
      activeStations:   10,
      onTime,
      delayed,
      constrained,
      inTransit,
      atStation,
      networkRisk:      riskScore,
      riskCategory:     riskScore > 70 ? 'CRITICAL' : riskScore > 45 ? 'HIGH' : riskScore > 20 ? 'MODERATE' : 'NOMINAL',
      activeConflicts:  activeCritical,
      avgDelayMin:      parseFloat(avgDelay.toFixed(1)),
      hazardActive:     this.hazardActive
    };
  }

  // ─────────────────────────────────────────────────────────
  // TICK — Main simulation loop
  // ─────────────────────────────────────────────────────────
  tick(deltaMs = TICK_MS) {
    if (!this.clock.isRunning) return;
    const deltaSec = (deltaMs / 1000) * this.speedMultiplier;
    this.clock.tick(deltaMs);

    // Phase progress
    const phaseDur = SIMULATION_PHASES[this.currentPhase]?.durationSeconds || 20;
    this.phaseProgress = Math.min(100, this.phaseProgress + (deltaSec / phaseDur) * 100);

    // Move all trains
    this._updateAllTrains(deltaSec);

    // Headway constraints
    const violations = applyHeadwayConstraints(this.trains);

    // Update section + station states
    this.sectionStates = updateSectionStates(this.sectionStates, this.trains, violations);
    this.stationStates = updateStationStates(this.stationStates, this.trains);

    // Recompute signals
    this.signalStates = computeSignals(
      this.trains, this.sectionStates, this.stationStates,
      this.hazardActive, this.hazardSectionId
    );

    // Refresh ETAs
    this._refreshTrainETAs();

    // Log new violations
    this._checkViolations(violations);

    // ── ML change detection (does NOT fetch — only schedules if material change) ──
    const cabTrain = this.trains.find(t => t.id === this.activeCabTrainId);
    if (cabTrain) {
      mlPredictionProvider.onSimulationTick(cabTrain, {
        allTrains:    this.trains,
        signalStates: this.signalStates,
        stationStates: this.stationStates
      });
    }

    // Auto-advance phase
    if (this.phaseProgress >= 100 && this.autoPlay) {
      this.setPhase(this.currentPhase < TOTAL_PHASES ? this.currentPhase + 1 : 1);
      return;
    }

    this.notify();
  }

  // ─────────────────────────────────────────────────────────
  // Train Physics
  // ─────────────────────────────────────────────────────────
  _updateAllTrains(deltaSec) {
    this.trains.forEach(train => {
      if (train.hasReachedDestination) return;

      if (train.isDwelling) {
        this._updateDwelling(train, deltaSec);
      } else {
        this._updateInTransit(train, deltaSec);
      }

      this._updatePositionKm(train);
    });
  }

  _updateDwelling(train, deltaSec) {
    train.dwellTime += deltaSec;

    // Count down delay
    if ((train.delay || 0) > 0) {
      train.delay = Math.max(0, train.delay - deltaSec / 60);
    }

    // Loco Pilot HOLD keeps the train locked
    const decision = this.locoPilotDecisions[train.id];
    if (decision === 'HOLD') return;

    // Depart when dwell complete and no delay
    if (train.dwellTime >= train.dwellTarget && (train.delay || 0) <= 0) {
      this._departTrain(train);
    }
  }

  _updateInTransit(train, deltaSec) {
    const config = TRAIN_TYPE_CONFIG[train.type];
    const secDef  = SECTIONS[train.currentSection];
    if (!secDef) return;

    // Effective speed limit from signals
    const sigLimit = getEffectiveSpeedLimit(train, this.signalStates);

    // Target speed determination
    let targetSpeed = Math.min(
      train.targetSpeed || config.normalSpeed,
      train.maxSpeed,
      secDef.speedLimitKmH,
      sigLimit
    );

    // Speed restriction (TSR)
    if (train.speedRestriction) {
      targetSpeed = Math.min(targetSpeed, train.speedRestriction);
    }

    // Phase 5: express speed ceiling
    if (this.currentPhase === 5 && this.hazardActive &&
        (train.type === 'EXPRESS' || train.type === 'INTERCITY')) {
      targetSpeed = Math.min(targetSpeed, 40);
    }

    // Approach deceleration: slow down in last 10% of section
    if (train.positionPct >= APPROACH_ZONE_PCT) {
      targetSpeed = Math.min(targetSpeed, 40);
    }

    // Smooth speed adjustment
    const prevSpeed = train.speed;
    if (train.speed < targetSpeed) {
      train.speed = Math.min(targetSpeed, train.speed + config.accelRate * deltaSec);
    } else if (train.speed > targetSpeed) {
      train.speed = Math.max(targetSpeed, train.speed - config.decelRate * deltaSec);
    }

    // Log significant speed changes
    if (Math.abs(train.speed - prevSpeed) > 15 && !this.loggedMilestones.has(`SPD_${train.id}`)) {
      this.loggedMilestones.add(`SPD_${train.id}`);
      this._addEvent('DISPATCH', train.id,
        `${train.id} speed ${Math.round(prevSpeed)} → ${Math.round(train.speed)} KM/H`,
        { speedFrom: Math.round(prevSpeed), speedTo: Math.round(train.speed) }
      );
      setTimeout(() => this.loggedMilestones.delete(`SPD_${train.id}`), 8000);
    }

    // Move the train
    if (train.speed <= 0) return;
    const distKm      = (train.speed / 3600) * deltaSec;
    const progressDelta = (distKm / secDef.lengthKm) * 100;
    train.positionPct += progressDelta;

    // Section boundary reached
    if (train.positionPct >= 100) {
      train.positionPct = 100;
      this._advanceSection(train);
    }
  }

  _advanceSection(train) {
    const secDef  = SECTIONS[train.currentSection];
    if (!secDef) return;

    // Which station do we arrive at?
    const arrivalStationId = train.direction === 'SOUTHBOUND'
      ? secDef.toStation
      : secDef.fromStation;

    // Check if this is the destination
    if (arrivalStationId === train.destination) {
      this._arriveAtDestination(train, arrivalStationId);
      return;
    }

    // Intermediate station — dwell briefly
    const platform = findAvailablePlatform(arrivalStationId, this.stationStates, train) || 'P1';
    const prevSection = train.currentSection;
    train.isDwelling    = true;
    train.currentStation = arrivalStationId;
    train.currentSection = null;
    train.positionPct   = 0;
    train.speed         = 0;
    train.platform      = platform;
    train.dwellTarget   = TRAIN_TYPE_CONFIG[train.type].defaultDwellSec;
    train.dwellTime     = 0;
    train.status        = 'STATION DWELL';

    this._addEvent('DISPATCH', train.id, `${train.id} ARRIVED ${arrivalStationId.replace('STATION_', '')} (${platform})`);
  }

  _arriveAtDestination(train, stationId) {
    const platform = findAvailablePlatform(stationId, this.stationStates, train) || 'P1';
    train.isDwelling          = true;
    train.hasReachedDestination = true;
    train.currentStation      = stationId;
    train.currentSection      = null;
    train.speed               = 0;
    train.positionPct         = 100;
    train.platform            = platform;
    train.status              = 'ARRIVED';
    this._addEvent('DISPATCH', train.id, `${train.id} ARRIVED ${stationId.replace('STATION_', '')} — TERMINUS`);
  }

  _departTrain(train) {
    // Find which direction to go next
    const stIdx = STATION_CHAIN.indexOf(train.currentStation);
    const dIdx  = STATION_CHAIN.indexOf(train.destination);
    if (stIdx === -1 || dIdx === -1 || stIdx === dIdx) return;

    const step = dIdx > stIdx ? 1 : -1;
    const nextStation = STATION_CHAIN[stIdx + step];

    // Find the section connecting currentStation and nextStation
    const secEntry = Object.values(SECTIONS).find(s =>
      (s.fromStation === train.currentStation && s.toStation === nextStation) ||
      (s.toStation === train.currentStation && s.fromStation === nextStation)
    );
    if (!secEntry) return;

    // Rebuild route if needed
    if (!train.route?.length) {
      train.route = calculateRoute(train.currentStation, train.destination);
    }

    const prevStation = train.currentStation;
    train.isDwelling    = false;
    train.currentSection = secEntry.id;
    train.currentStation = null;
    train.positionPct   = 0;
    train.speed         = 0;
    train.targetSpeed   = TRAIN_TYPE_CONFIG[train.type].normalSpeed;
    train.dwellTime     = 0;
    train.dwellTarget   = 0;
    train.platform      = null;
    train.status        = 'IN TRANSIT';

    this._addEvent('DISPATCH', train.id, `${train.id} DEPARTED ${prevStation.replace('STATION_', '')} → ${nextStation.replace('STATION_', '')}`);
  }

  _checkViolations(violations) {
    violations.forEach(v => {
      const key = `HW_${v.followerId}_${v.leaderId}`;
      if (!this.loggedMilestones.has(key)) {
        this.loggedMilestones.add(key);
        this._addEvent('WARNING', v.followerId,
          `HEADWAY: ${v.followerId} following ${v.leaderId} — ${v.severity} (${(v.headwaySec/60).toFixed(1)} min)`,
          { headwaySec: v.headwaySec }
        );
        setTimeout(() => this.loggedMilestones.delete(key), 30000);
      }
    });
  }

  _refreshTrainETAs() {
    const simTimeSec = this._getSimTimeSec();
    const etaMap = recalculateAllETAs(this.trains, simTimeSec, this.sectionStates);
    this.trains.forEach(t => {
      const eta = etaMap[t.id];
      if (eta) {
        t.eta          = eta.etaMinutes;
        t.etaAbsolute  = eta.etaAbsolute;
        t.etaSeconds   = eta.etaSeconds;
        t.remainingKm  = eta.remainingKm;
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // LOCO PILOT DECISION API (public — wired to UI buttons)
  // ─────────────────────────────────────────────────────────
  locoPilotDecide(trainId, decision) {
    const train = this.trains.find(t => t.id === trainId);
    if (!train) return;

    this.locoPilotDecisions[trainId] = decision;

    if (decision === 'PROCEED') {
      // If dwelling, initiate departure
      if (train.isDwelling && !train.hasReachedDestination) {
        train.delay   = 0;
        train.dwellTime = train.dwellTarget; // trigger depart on next tick
        train.status  = 'DEPARTING';
      }
      this._addEvent('DECISION', trainId, `${trainId} — LOCO PILOT DECISION: PROCEED`);
      this._addEvent('DISPATCH', trainId, `${trainId} DEPARTURE AUTHORIZED`);

      // ── Request immediate ML prediction refresh ──────────
      mlPredictionProvider.onLocoPilotDecision(ML_TRIGGER_EVENTS.LOCO_PROCEED);

      // Update signal/route state
      this.notify();

      // Trigger downstream ETA recalculation with a small delay
      setTimeout(() => {
        this._refreshTrainETAs();
        const affectedTrains = this.trains.filter(t =>
          t.id !== trainId && t.direction === train.direction
        );
        affectedTrains.forEach(t => {
          if (Math.abs((t.etaSeconds || 0) - ((t._prevEtaSec || 0))) > 60) {
            this._addEvent('PREDICTION', t.id,
              `${t.id} ETA updated due to ${trainId} departure`);
          }
        });
        this.notify();
      }, 200);

    } else if (decision === 'HOLD') {
      if (train.isDwelling) {
        train.status = 'HELD';
        train.delay  = (train.delay || 0) + 2; // add 2 min delay
      }
      this._addEvent('DECISION', trainId, `${trainId} — LOCO PILOT DECISION: HOLD`);
      this._addEvent('WARNING',  trainId, `${trainId} HELD — delay accumulating`);

      // ── Request immediate ML prediction refresh ──────────
      mlPredictionProvider.onLocoPilotDecision(ML_TRIGGER_EVENTS.LOCO_HOLD);

      // Calculate cascading effects
      const affected = this.trains.filter(t =>
        t.id !== trainId &&
        t.direction === train.direction &&
        !t.hasReachedDestination
      );
      if (affected.length > 0) {
        this._addEvent('PREDICTION', null,
          `${affected.length} following trains may be impacted by ${trainId} HOLD`
        );
      }
      this.notify();
    }
  }

  // ─────────────────────────────────────────────────────────
  // Scenario: Modify Train
  // ─────────────────────────────────────────────────────────
  applyScenario(trainId, paramChange) {
    const train = this.trains.find(t => t.id === trainId);
    if (!train) return null;

    if (!this.baselineSnapshot) {
      this.baselineSnapshot = cloneTrains(this.trains);
    }

    const simTimeSec = this._getSimTimeSec();
    const impactReport = impactPredict(
      { trains: this.trains, simulationTimeSec: simTimeSec },
      trainId, paramChange
    );

    // Apply
    if (paramChange.speed !== undefined)           { const prev = train.speed; train.speed = paramChange.speed; if (Math.abs(prev - paramChange.speed) > 5) this._addEvent('DISPATCH', trainId, `${trainId} SPEED SET ${Math.round(prev)} → ${paramChange.speed} KM/H`); }
    if (paramChange.targetSpeed !== undefined)     train.targetSpeed = paramChange.targetSpeed;
    if (paramChange.speedRestriction !== undefined) train.speedRestriction = paramChange.speedRestriction;
    if (paramChange.dwellTime !== undefined)       { train.dwellTarget = paramChange.dwellTime; train.isDwelling = true; }
    if (paramChange.departureDelay !== undefined)  { train.delay = (train.delay || 0) + paramChange.departureDelay; this._addEvent('WARNING', trainId, `${trainId} DELAY +${paramChange.departureDelay} MIN`); }

    this.activeScenario = { trainId, paramChange, impactReport };
    this._addEvent('DISPATCH', trainId, `SCENARIO: ${trainId} parameters modified`);
    if (impactReport?.deltas) {
      impactReport.deltas.slice(1, 4).forEach(d => {
        if (Math.abs(d.deltaSeconds) > 60) {
          this._addEvent('PREDICTION', d.trainId, `${d.trainId} ETA ${d.deltaMinutes > 0 ? '+' : ''}${d.deltaMinutes?.toFixed(1)} MIN`);
        }
      });
    }
    this.notify();
    return impactReport;
  }

  resetToBaseline() {
    if (this.baselineSnapshot) {
      this.trains = cloneTrains(this.baselineSnapshot);
      this.baselineSnapshot = null;
      this.trains.forEach(t => this._updatePositionKm(t));
    }
    this.activeScenario = null;
    this._refreshTrainETAs();
    this._addEvent('SYSTEM', null, 'SCENARIO RESET — Network restored to baseline');
    this.notify();
  }

  modifyTrain(trainId, params) { return this.applyScenario(trainId, params); }

  getImpactAnalysis(trainId, paramChange) {
    const simTimeSec = this._getSimTimeSec();
    return impactPredict({ trains: this.trains, simulationTimeSec: simTimeSec }, trainId, paramChange);
  }

  getPrediction(trainId) {
    const train = this.trains.find(t => t.id === trainId);
    if (!train) return null;
    return predictionPredict(train, {
      trains: this.trains,
      stationStates: this.stationStates,
      sectionStates: this.sectionStates,
      simulationTimeSec: this._getSimTimeSec(),
      signalStates: this.signalStates
    });
  }

  // ─────────────────────────────────────────────────────────
  // Backward-compat Loco Pilot workflow
  // ─────────────────────────────────────────────────────────
  requestDeparture(trainId = 'LOCAL_101') {
    const evalResult = this._buildDepartureEval();
    if (evalResult.authorized) {
      const t = this.trains.find(x => x.id === trainId);
      if (t) t.status = 'AUTHORIZED';
      this._addEvent('DISPATCH', trainId, `${trainId} DEPARTURE REQUEST AUTHORIZED`);
    } else {
      const t = this.trains.find(x => x.id === trainId);
      if (t) t.status = 'HELD BY INTERLOCKING';
      this._addEvent('WARNING', trainId, `${trainId} HELD — ${evalResult.reason}`);
    }
    this.notify();
    return evalResult;
  }

  keepWaiting(trainId = 'LOCAL_101') {
    this.locoPilotDecide(trainId, 'HOLD');
  }

  confirmDepart(trainId = 'LOCAL_101') {
    if (this.currentPhase === 5 && this.hazardActive) {
      this._addEvent('CRITICAL', trainId, 'DEPARTURE ABORTED — SIL-4 SAFETY OVERRIDE ACTIVE');
      const t = this.trains.find(x => x.id === trainId);
      if (t) t.status = 'HELD BY INTERLOCKING';
      this.notify();
      return false;
    }
    this.locoPilotDecide(trainId, 'PROCEED');
    return true;
  }

  setActiveCab(trainId) {
    this.activeCabTrainId = trainId;
    this._addEvent('SYSTEM', trainId, `CAB SWITCHED → ${trainId}`);
    // Start polling the ML backend for the newly selected train
    mlPredictionProvider.startPolling(trainId);
    this.notify();
  }

  // ─────────────────────────────────────────────────────────
  // Playback Controls
  // ─────────────────────────────────────────────────────────
  play() {
    if (this.clock.isRunning) return;
    this.clock.isRunning = true;
    this.startTicker();
    this._addEvent('SYSTEM', null, 'SIMULATION STARTED');
    this.notify();
  }

  pause() {
    this.clock.isRunning = false;
    this.stopTicker();
    this._addEvent('SYSTEM', null, 'SIMULATION PAUSED');
    this.notify();
  }

  togglePlayPause() { this.clock.isRunning ? this.pause() : this.play(); }

  reset() {
    this.pause();
    this.currentPhase     = 1;
    this.phaseProgress    = 0;
    this.hazardActive     = false;
    this.hazardSectionId  = null;
    this.activeScenario   = null;
    this.baselineSnapshot = null;
    this.activeCabTrainId = 'LOCAL_101';
    this.locoPilotDecisions = { 'LOCAL_101': 'WAITING' };
    this.loggedMilestones.clear();
    this.clock.reset();
    this._initNetwork();
    this.eventLog = [];
    this._addEvent('SYSTEM', null, 'SIMULATION RESET — Restored to deterministic initial state (Phase 1)');
    this.notify();
  }

  setPhase(phaseNum) {
    if (phaseNum < 1 || phaseNum > TOTAL_PHASES) return;
    this.currentPhase  = phaseNum;
    this.phaseProgress = 0;
    const phaseMeta = SIMULATION_PHASES[phaseNum];
    if (phaseMeta?.baseTime) this.clock.setTime(phaseMeta.baseTime);

    this._applyPhaseConditions(phaseNum);
    this._addEvent('PHASE', null, `SCENARIO: ${SIMULATION_PHASES[phaseNum]?.name || 'PHASE ' + phaseNum}`);
    this.notify();
  }

  _applyPhaseConditions(phase) {
    // Reset phase-specific overrides
    this.hazardActive    = false;
    this.hazardSectionId = null;
    this.trains.forEach(t => {
      t.speedRestriction = null;
      t.affectedBy = [];
      t.affecting  = [];
    });

    if (phase === 2) {
      // LOCAL_101 delayed
      const local101 = this.trains.find(t => t.id === 'LOCAL_101');
      if (local101 && local101.isDwelling) {
        local101.delay  = 8;
        local101.status = 'DELAYED';
        this._addEvent('WARNING', 'LOCAL_101', 'LOCAL_101 DELAYED +8 MIN — downstream impact propagating');
      }
    } else if (phase === 3) {
      // EXPRESS_201 close approach to junction
      const e201 = this.trains.find(t => t.id === 'EXPRESS_201');
      if (e201 && !e201.isDwelling) {
        e201.positionPct  = 48;
        e201.speed        = 88;
        e201.targetSpeed  = 88;
        this._addEvent('DISPATCH', 'EXPRESS_201', 'EXPRESS_201 APPROACHING JUNCTION J-01 — headway watch active');
      }
    } else if (phase === 4) {
      // Conflict scenario
      const e201 = this.trains.find(t => t.id === 'EXPRESS_201');
      const r401 = this.trains.find(t => t.id === 'REGIONAL_401');
      if (e201 && !e201.isDwelling) {
        e201.positionPct = 45;
        e201.speed       = 60;
      }
      if (r401 && !r401.isDwelling) {
        r401.positionPct = 55;
        r401.speed       = 90;
      }
      this._addEvent('WARNING', null, 'PREDICTED CONFLICT: EXPRESS_201 / REGIONAL_401 — Junction J-02');
    } else if (phase === 5) {
      // Safety/Vision event
      this.hazardActive    = true;
      this.hazardSectionId = 'SEC_A_B'; // hazard in section A-B
      this.trains.filter(t => t.type === 'EXPRESS' || t.type === 'INTERCITY').forEach(t => {
        t.speedRestriction = 40;
        if (t.speed > 40) t.speed = 40;
        t.targetSpeed = 40;
      });
      this._addEvent('CRITICAL', null, 'AI VISION SAFETY EVENT — Speed restriction 40 KM/H (all express trains)');
    }
  }

  nextPhase() { this.setPhase(this.currentPhase < TOTAL_PHASES ? this.currentPhase + 1 : 1); }
  prevPhase() { if (this.currentPhase > 1) this.setPhase(this.currentPhase - 1); }
  toggleAutoPlay() { this.autoPlay = !this.autoPlay; this.notify(); }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
    this.clock.speedMultiplier = multiplier;
    this._addEvent('SYSTEM', null, `SIMULATION SPEED: ${multiplier}×`);
    this.notify();
  }

  startTicker() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => this.tick(TICK_MS), TICK_MS);
  }

  stopTicker() {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  }

  getSimulationStatus() {
    return {
      phase:            this.currentPhase,
      totalPhases:      TOTAL_PHASES,
      phaseProgress:    Math.round(this.phaseProgress),
      phaseMeta:        SIMULATION_PHASES[this.currentPhase],
      isRunning:        this.clock.isRunning,
      autoPlay:         this.autoPlay,
      simulationTime:   this.clock.getTimeString(),
      speedMultiplier:  this.speedMultiplier,
      activeCabTrainId: this.activeCabTrainId,
      eventLog:         this.eventLog,
      activeScenario:   this.activeScenario,
      hazardActive:     this.hazardActive
    };
  }
}

// Global singleton — one engine for all pages
export const simulationEngine = new SimulationEngine();
