/**
 * RAIL//AI Simulation Engine
 * Central state store, continuous physics/kinematics engine, and safety orchestrator.
 * Fully synchronized across Simulator, Loco Pilot, Station Master, and Control Room.
 */

import { SimulationClock } from './simulationClock';
import { computeSimulationState } from './simulationState';
import { evaluateDeparture, calculateNetworkRisk } from './safetyEvaluator';
import { SIMULATION_PHASES, TOTAL_PHASES } from './simulationConstants';

export class SimulationEngine {
  constructor() {
    this.currentPhase = 1;
    this.phaseProgress = 0; // 0% to 100% within current phase
    this.clock = new SimulationClock('14:20:00');
    this.speedMultiplier = 1;
    this.autoPlay = false;
    this.listeners = new Set();
    this.timerId = null;

    // Active Driver Cab selected on Loco Pilot page
    this.activeCabTrainId = 'LOCAL_101'; // Default to LOCAL_101 for the interactive departure workflow

    // Train Kinematics and Lifecycle States
    this.local101 = {
      id: 'LOCAL_101',
      departureState: 'WAITING', // 'WAITING' | 'HELD' | 'AUTHORIZED' | 'DEPARTED' | 'ARRIVED'
      progressPct: 0,
      speed: 0,
      targetSpeed: 0,
      initialDelayMinutes: 8,
      dwellSeconds: 480,
      distanceTraversedKm: 0,
      distanceRemainingKm: 24.8,
      status: 'WAITING AT STATION B (P1)'
    };

    this.express201 = {
      id: 'EXPRESS_201',
      progressPct: 20, // starts at 20% in phase 1
      speed: 118,
      targetSpeed: 118,
      distanceTraversedKm: 4.96,
      distanceRemainingKm: 19.84,
      status: 'IN TRANSIT (SECTION B)'
    };

    this.local102 = {
      id: 'LOCAL_102',
      progressPct: 25,
      speed: 75,
      targetSpeed: 75,
      distanceTraversedKm: 6.2,
      distanceRemainingKm: 18.6,
      status: 'IN TRANSIT (UP MAIN)'
    };

    this.express202 = {
      id: 'EXPRESS_202',
      progressPct: 15,
      speed: 130,
      targetSpeed: 130,
      distanceTraversedKm: 4.8,
      distanceRemainingKm: 27.2,
      status: 'IN TRANSIT (SECTION C)'
    };

    // State Transition Flags (to avoid duplicate log spamming)
    this.loggedMilestones = new Set();

    // Event Log
    this.eventLog = [
      { time: '14:20:00', text: 'Simulation initialized — Corridor Alpha Section B nominal transit active', phase: 1, type: 'SYSTEM' },
      { time: '14:20:05', text: 'Interlocking systems online: Station B, Section B, Station C', phase: 1, type: 'SIGNALS' }
    ];

    // Initial state computation
    this.state = this.buildState();
  }

  // --- Subscriptions ---
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.state = this.buildState();
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error in simulation subscriber:', err);
      }
    });
  }

  // --- Build Unified State ---
  buildState() {
    return computeSimulationState({
      phase: this.currentPhase,
      phaseProgress: this.phaseProgress,
      simTime: this.clock.getTimeString(),
      activeCabTrainId: this.activeCabTrainId,
      trainKinematics: {
        local101: this.local101,
        express201: this.express201,
        local102: this.local102,
        express202: this.express202
      },
      eventLog: this.eventLog,
      departureEvaluation: evaluateDeparture({
        phase: this.currentPhase,
        trains: [this.local101, this.express201, this.local102, this.express202],
        hazardActive: this.currentPhase === 5
      }, 'LOCAL_101')
    });
  }

  // --- Event Logger Utility ---
  addEvent(text, type = 'OPERATIONS') {
    const time = this.clock.getTimeString();
    this.eventLog = [
      { time, text, phase: this.currentPhase, type },
      ...this.eventLog.slice(0, 49) // Keep last 50 events
    ];
  }

  // --- Decision & Departure Workflow (LOCAL_101) ---
  requestDeparture(trainId = 'LOCAL_101') {
    const evalResult = evaluateDeparture({
      phase: this.currentPhase,
      trains: [this.local101, this.express201, this.local102, this.express202],
      hazardActive: this.currentPhase === 5
    }, trainId);

    if (evalResult.authorized) {
      this.local101.departureState = 'AUTHORIZED';
      this.addEvent(`LOCAL_101 DEPARTURE REQUEST AUTHORIZED — ROUTE AVAILABLE`, 'SAFETY');
    } else {
      this.local101.departureState = 'HELD';
      this.addEvent(`LOCAL_101 DEPARTURE REQUEST: MOVEMENT HELD — ${evalResult.reason}`, 'WARNING');
    }

    this.notify();
    return evalResult;
  }

  keepWaiting(trainId = 'LOCAL_101') {
    this.local101.departureState = 'WAITING';
    this.addEvent(`LOCAL_101 DRIVER ACKNOWLEDGED HOLD — STANDBY FOR EXPRESS CLEARANCE`, 'CAB');
    this.notify();
  }

  confirmDepart(trainId = 'LOCAL_101') {
    const evalResult = evaluateDeparture({
      phase: this.currentPhase,
      trains: [this.local101, this.express201, this.local102, this.express202],
      hazardActive: this.currentPhase === 5
    }, trainId);

    if (!evalResult.authorized && this.currentPhase === 5) {
      this.addEvent(`DEPARTURE ABORTED: SIL-4 SAFETY OVERRIDE ACTIVE`, 'CRITICAL');
      this.local101.departureState = 'HELD';
      this.notify();
      return false;
    }

    this.local101.departureState = 'DEPARTED';
    this.local101.speed = 45; // Initial departure acceleration
    this.local101.targetSpeed = 80;
    this.local101.status = 'DEPARTING STATION B (P1)';
    this.addEvent(`LOCAL_101 DEPARTED STATION B PLATFORM 1`, 'DISPATCH');
    this.addEvent(`LOCAL_101 ENTERED SECTION B (DOWN CORRIDOR)`, 'OPERATIONS');
    this.notify();
    return true;
  }

  setActiveCab(trainId) {
    this.activeCabTrainId = trainId;
    this.notify();
  }

  // --- Dynamic Tick & Continuous Physics ---
  tick(deltaMs = 100) {
    if (!this.clock.isRunning) return;

    const deltaSec = (deltaMs / 1000) * this.speedMultiplier;
    this.clock.tick(deltaMs);

    // 1. Advance Phase Progress
    const phaseDuration = SIMULATION_PHASES[this.currentPhase]?.durationSeconds || 15;
    const progressInc = (deltaSec / phaseDuration) * 100;
    this.phaseProgress += progressInc;

    // 2. Continuous Train Kinematics
    this.updateTrainKinematics(deltaSec);

    // 3. Milestone Detection & Event Emission
    this.checkMilestones();

    // 4. Auto advance phase if configured or wrap
    if (this.phaseProgress >= 100) {
      if (this.autoPlay) {
        if (this.currentPhase < TOTAL_PHASES) {
          this.setPhase(this.currentPhase + 1);
          return;
        } else {
          this.setPhase(1);
          return;
        }
      } else {
        this.phaseProgress = 100;
      }
    }

    this.notify();
  }

  updateTrainKinematics(deltaSec) {
    const corridorLengthKm = 24.8;

    // --- EXPRESS 201 Kinematics ---
    // Target speed depends on phase and approach to Station C
    let expTargetSpeed = 118;
    if (this.currentPhase === 3) {
      expTargetSpeed = 96; // Approach decel
    } else if (this.currentPhase === 4) {
      expTargetSpeed = 88;
    } else if (this.currentPhase === 5) {
      expTargetSpeed = 40; // Obstacle / Safety restriction clamp
    }

    // Smooth speed interpolation (acceleration/braking curve)
    if (this.express201.speed < expTargetSpeed) {
      this.express201.speed = Math.min(expTargetSpeed, this.express201.speed + 4 * deltaSec);
    } else if (this.express201.speed > expTargetSpeed) {
      this.express201.speed = Math.max(expTargetSpeed, this.express201.speed - 6 * deltaSec);
    }

    // Move Express 201 continuously
    if (this.express201.progressPct < 98) {
      const distTraveledThisTick = (this.express201.speed / 3600) * deltaSec;
      const progressDelta = (distTraveledThisTick / corridorLengthKm) * 100;
      this.express201.progressPct = Math.min(98, this.express201.progressPct + progressDelta);
      this.express201.distanceTraversedKm = parseFloat(((this.express201.progressPct / 100) * corridorLengthKm).toFixed(2));
      this.express201.distanceRemainingKm = parseFloat(Math.max(0, corridorLengthKm - this.express201.distanceTraversedKm).toFixed(2));
    }

    // --- LOCAL 101 Kinematics ---
    if (this.local101.departureState === 'DEPARTED') {
      let locTargetSpeed = this.currentPhase === 5 ? 40 : 80;
      if (this.local101.speed < locTargetSpeed) {
        this.local101.speed = Math.min(locTargetSpeed, this.local101.speed + 5 * deltaSec);
      } else if (this.local101.speed > locTargetSpeed) {
        this.local101.speed = Math.max(locTargetSpeed, this.local101.speed - 5 * deltaSec);
      }

      if (this.local101.progressPct < 98) {
        const distTraveledThisTick = (this.local101.speed / 3600) * deltaSec;
        const progressDelta = (distTraveledThisTick / corridorLengthKm) * 100;
        this.local101.progressPct = Math.min(98, this.local101.progressPct + progressDelta);
        this.local101.distanceTraversedKm = parseFloat(((this.local101.progressPct / 100) * corridorLengthKm).toFixed(2));
        this.local101.distanceRemainingKm = parseFloat(Math.max(0, corridorLengthKm - this.local101.distanceTraversedKm).toFixed(2));

        if (this.local101.progressPct > 85) {
          this.local101.status = 'APPROACHING STATION C (P1)';
        } else if (this.local101.progressPct > 10) {
          this.local101.status = 'IN TRANSIT (SECTION B)';
        }
      } else {
        this.local101.status = 'ARRIVED AT STATION C (P1)';
        this.local101.speed = 0;
        this.local101.departureState = 'ARRIVED';
      }
    } else {
      // Held at Station B: dwell time increases
      this.local101.dwellSeconds += deltaSec;
    }

    // --- LOCAL 102 Kinematics (Northbound UP MAIN) ---
    if (this.local102.progressPct < 95) {
      const distTraveled = (this.local102.speed / 3600) * deltaSec;
      const progressDelta = (distTraveled / corridorLengthKm) * 100;
      this.local102.progressPct = Math.min(95, this.local102.progressPct + progressDelta);
      this.local102.distanceTraversedKm = parseFloat(((this.local102.progressPct / 100) * corridorLengthKm).toFixed(2));
      this.local102.distanceRemainingKm = parseFloat(Math.max(0, corridorLengthKm - this.local102.distanceTraversedKm).toFixed(2));
    }

    // --- EXPRESS 202 Kinematics (Northbound Section C) ---
    if (this.express202.progressPct < 95) {
      const distTraveled = (this.express202.speed / 3600) * deltaSec;
      const progressDelta = (distTraveled / 32.0) * 100;
      this.express202.progressPct = Math.min(95, this.express202.progressPct + progressDelta);
      this.express202.distanceTraversedKm = parseFloat(((this.express202.progressPct / 100) * 32.0).toFixed(2));
      this.express202.distanceRemainingKm = parseFloat(Math.max(0, 32.0 - this.express202.distanceTraversedKm).toFixed(2));
    }
  }

  checkMilestones() {
    // 1. Express approaching Junction J-02 (KM 11.5 - 12.4 / progress > 45%)
    if (this.express201.progressPct >= 45 && !this.loggedMilestones.has('EXP_APPROACH_J02')) {
      this.loggedMilestones.add('EXP_APPROACH_J02');
      this.addEvent('EXPRESS_201 APPROACHING JUNCTION J-02 INTERLOCKING', 'SIGNALS');
    }

    // 2. Express clearing Junction J-02 (progress > 58%)
    if (this.express201.progressPct >= 58 && !this.loggedMilestones.has('EXP_CLEARED_J02')) {
      this.loggedMilestones.add('EXP_CLEARED_J02');
      this.addEvent('EXPRESS_201 CLEARED JUNCTION J-02 — HEADWAY NOW SAFE', 'SAFETY');
      this.addEvent('SECTION B DOWN ROUTE NOW AVAILABLE FOR LOCAL_101 DEPARTURE', 'DISPATCH');
    }

    // 3. Phase 5 Hazard Milestone
    if (this.currentPhase === 5 && !this.loggedMilestones.has('PHASE_5_HAZARD')) {
      this.loggedMilestones.add('PHASE_5_HAZARD');
      this.addEvent('AI VISION SAFETY EVENT: Track hazard/obstacle detected in Section B', 'CRITICAL');
      this.addEvent('EMERGENCY SPEED CEILING APPLIED (40 KM/H) — SIL-4 RESTRICTION', 'SAFETY');
    }
  }

  // --- Playback Controls ---
  play() {
    if (this.clock.isRunning) return;
    this.clock.isRunning = true;
    this.startTicker();
    this.notify();
  }

  pause() {
    this.clock.isRunning = false;
    this.stopTicker();
    this.notify();
  }

  togglePlayPause() {
    if (this.clock.isRunning) {
      this.pause();
    } else {
      this.play();
    }
  }

  reset() {
    this.pause();
    this.currentPhase = 1;
    this.phaseProgress = 0;
    this.clock.reset();
    this.loggedMilestones.clear();

    this.local101 = {
      id: 'LOCAL_101',
      departureState: 'WAITING',
      progressPct: 0,
      speed: 0,
      targetSpeed: 0,
      initialDelayMinutes: 8,
      dwellSeconds: 480,
      distanceTraversedKm: 0,
      distanceRemainingKm: 24.8,
      status: 'WAITING AT STATION B (P1)'
    };

    this.express201 = {
      id: 'EXPRESS_201',
      progressPct: 20,
      speed: 118,
      targetSpeed: 118,
      distanceTraversedKm: 4.96,
      distanceRemainingKm: 19.84,
      status: 'IN TRANSIT (SECTION B)'
    };

    this.local102 = {
      id: 'LOCAL_102',
      progressPct: 25,
      speed: 75,
      targetSpeed: 75,
      distanceTraversedKm: 6.2,
      distanceRemainingKm: 18.6,
      status: 'IN TRANSIT (UP MAIN)'
    };

    this.express202 = {
      id: 'EXPRESS_202',
      progressPct: 15,
      speed: 130,
      targetSpeed: 130,
      distanceTraversedKm: 4.8,
      distanceRemainingKm: 27.2,
      status: 'IN TRANSIT (SECTION C)'
    };

    this.eventLog = [
      { time: '14:20:00', text: 'Simulation reset to initial state (Phase 1 — Normal Operations)', phase: 1, type: 'SYSTEM' },
      { time: '14:20:05', text: 'Corridor Alpha baseline restored: Station B P1 occupied by LOCAL_101', phase: 1, type: 'DISPATCH' }
    ];

    this.notify();
  }

  setPhase(phaseNum) {
    if (phaseNum < 1 || phaseNum > TOTAL_PHASES) return;
    this.currentPhase = phaseNum;
    this.phaseProgress = 0;
    const phaseMeta = SIMULATION_PHASES[phaseNum];
    if (phaseMeta) {
      this.clock.setTime(phaseMeta.baseTime);
    }

    // Set appropriate continuous base positions for each scenario phase
    if (phaseNum === 1) {
      this.express201.progressPct = Math.max(this.express201.progressPct, 20);
    } else if (phaseNum === 2) {
      this.express201.progressPct = Math.max(this.express201.progressPct, 38);
    } else if (phaseNum === 3) {
      this.express201.progressPct = Math.max(this.express201.progressPct, 52); // approaching J-02
    } else if (phaseNum === 4) {
      this.express201.progressPct = Math.max(this.express201.progressPct, 68); // conflict evaluation / clear
    } else if (phaseNum === 5) {
      this.express201.progressPct = Math.max(this.express201.progressPct, 82); // approaching Station C with obstacle
    }

    this.addEvent(`Scenario transitioned to ${SIMULATION_PHASES[phaseNum]?.name || 'PHASE ' + phaseNum}`, 'PHASE');
    this.notify();
  }

  nextPhase() {
    if (this.currentPhase < TOTAL_PHASES) {
      this.setPhase(this.currentPhase + 1);
    } else {
      this.setPhase(1);
    }
  }

  prevPhase() {
    if (this.currentPhase > 1) {
      this.setPhase(this.currentPhase - 1);
    }
  }

  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;
    this.notify();
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
    this.clock.speedMultiplier = multiplier;
    this.notify();
  }

  // --- Ticker Engine ---
  startTicker() {
    if (this.timerId) clearInterval(this.timerId);
    const intervalMs = 100;
    this.timerId = setInterval(() => {
      this.tick(intervalMs);
    }, intervalMs);
  }

  stopTicker() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  getSimulationStatus() {
    return {
      phase: this.currentPhase,
      totalPhases: TOTAL_PHASES,
      phaseProgress: Math.round(this.phaseProgress),
      phaseMeta: SIMULATION_PHASES[this.currentPhase],
      isRunning: this.clock.isRunning,
      autoPlay: this.autoPlay,
      simulationTime: this.clock.getTimeString(),
      speedMultiplier: this.speedMultiplier,
      activeCabTrainId: this.activeCabTrainId,
      eventLog: this.eventLog
    };
  }
}

// Global Singleton Instance
export const simulationEngine = new SimulationEngine();
