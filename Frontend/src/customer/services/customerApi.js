/**
 * RAIL//AI — Customer Railway Journey & Live ETA Transformation Engine
 * 
 * Pure presentation transformation layer.
 * Consumes the single source of truth from SimulationEngine and MLPredictionProvider.
 * NO duplicate timers, NO duplicate simulation state, NO mock train lists.
 */

import { STATIONS, STATION_CHAIN, SECTIONS } from '../../simulator/networkModel';
import { formatAbsoluteETA } from '../../simulator/etaEngine';

// Station definitions for Passenger UI
export const PASSENGER_STATIONS = Object.values(STATIONS).map(st => ({
  id: st.id,
  code: st.code,
  name: st.name,
  shortName: st.shortName,
  kmPost: st.kmPost,
  platforms: st.platforms,
  role: st.role,
  city: st.name.replace('Station ', 'Sector ')
}));

// Format delay minutes to clean passenger-facing text
export function formatCustomerDelay(delayMinutes) {
  if (delayMinutes === null || delayMinutes === undefined) return 'On time';
  const delay = Math.round(Number(delayMinutes));
  if (delay <= 0) return 'On time';
  return `+${delay} min`;
}

// Format clock time helper (e.g. adding minutes to HH:MM)
export function formatClockTime(timeStrOrDate, addMinutes = 0) {
  let totalMinutes = 14 * 60 + 20; // default 14:20
  if (typeof timeStrOrDate === 'string' && timeStrOrDate.includes(':')) {
    const parts = timeStrOrDate.split(':').map(Number);
    totalMinutes = parts[0] * 60 + parts[1];
  } else if (timeStrOrDate instanceof Date) {
    totalMinutes = timeStrOrDate.getHours() * 60 + timeStrOrDate.getMinutes();
  }
  totalMinutes = (totalMinutes + Math.round(addMinutes)) % (24 * 60);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Determine next upcoming station for a train based on position and direction
 */
export function getNextStation(train) {
  const isSouthbound = train.direction === 'SOUTHBOUND';
  const currentPos = train.positionKm ?? (isSouthbound ? 0 : 232);
  
  if (isSouthbound) {
    for (let i = 0; i < STATION_CHAIN.length; i++) {
      const st = STATIONS[STATION_CHAIN[i]];
      if (st.kmPost > currentPos) {
        return st;
      }
    }
    return STATIONS[train.destination] || STATIONS.STATION_J;
  } else {
    for (let i = STATION_CHAIN.length - 1; i >= 0; i--) {
      const st = STATIONS[STATION_CHAIN[i]];
      if (st.kmPost < currentPos) {
        return st;
      }
    }
    return STATIONS[train.destination] || STATIONS.STATION_A;
  }
}

/**
 * Transform a live simulation train into a customer-friendly presentation model
 */
export function transformTrainForCustomer(simTrain, simTime = '14:20:00', simTimeSec = 51600, mlPredictions = {}) {
  if (!simTrain) return null;

  const trainId = simTrain.id;
  const pred = mlPredictions[trainId] || mlPredictions[trainId?.replace(/_/g, '-')] || {};

  const type = simTrain.type || 'EXPRESS';
  const delay = Math.max(0, Math.round(simTrain.delay ?? pred.expected_delay_min ?? 0));
  const speed = Math.max(0, Math.round(simTrain.speed ?? 0));
  const targetSpeed = simTrain.targetSpeed || 100;

  const originStation = STATIONS[simTrain.origin] || STATIONS.STATION_A;
  const destStation = STATIONS[simTrain.destination] || STATIONS.STATION_J;

  // Compute Location string
  let currentLocation = 'In transit along corridor';
  if (simTrain.isDwelling && simTrain.currentStation) {
    const stName = STATIONS[simTrain.currentStation]?.name || simTrain.currentStation;
    currentLocation = `At ${stName} (${simTrain.platform || 'P1'})`;
  } else if (simTrain.currentSection && SECTIONS[simTrain.currentSection]) {
    const sec = SECTIONS[simTrain.currentSection];
    const fromName = STATIONS[sec.fromStation]?.name || 'Station';
    const toName = STATIONS[sec.toStation]?.name || 'Station';
    currentLocation = `Between ${fromName} and ${toName}`;
  }

  // Next station & Next station ETA
  const nextSt = getNextStation(simTrain);
  const distToNext = Math.abs((nextSt.kmPost || 0) - (simTrain.positionKm || 0));
  const effectiveSpeed = speed > 0 ? speed : targetSpeed;
  const secToNext = effectiveSpeed > 0 ? Math.round((distToNext / effectiveSpeed) * 3600) : 600;
  const nextStationEta = formatAbsoluteETA(simTimeSec, secToNext + delay * 60);

  // Baseline schedule derivation
  const originDepBase = formatClockTime('14:10', (STATION_CHAIN.indexOf(simTrain.origin) * 5) % 15);
  const totalRouteDistKm = Math.abs(destStation.kmPost - originStation.kmPost);
  const transitMins = Math.max(10, Math.round((totalRouteDistKm / targetSpeed) * 60));
  const scheduledArrival = formatClockTime(originDepBase, transitMins);

  // Predicted ETA: use live train.etaAbsolute from simulation etaEngine
  let predictedArrival = simTrain.etaAbsolute || pred.predicted_eta || null;
  if (!predictedArrival || predictedArrival === 'STANDBY') {
    predictedArrival = formatClockTime(scheduledArrival, delay);
  }

  // Passenger-friendly status
  let displayStatus = 'On Time';
  if (simTrain.hasReachedDestination) {
    displayStatus = 'Arrived';
  } else if (delay > 0) {
    displayStatus = 'Delayed';
  } else if (simTrain.isDwelling) {
    displayStatus = 'Boarding';
  } else if (speed > 0) {
    displayStatus = 'Running';
  } else {
    displayStatus = 'Standby';
  }

  const platform = simTrain.platform || (type === 'EXPRESS' ? 'Platform 1' : 'Platform 2');

  return {
    id: trainId,
    trainNumber: trainId.replace(/_/g, ' '),
    type,
    typeLabel: type.charAt(0) + type.slice(1).toLowerCase(),
    origin: originStation.name,
    originId: originStation.id,
    destination: destStation.name,
    destinationId: destStation.id,
    currentLocation,
    currentSpeedKmH: speed,
    targetSpeed,
    nextStation: nextSt.name,
    nextStationId: nextSt.id,
    nextStationEta,
    scheduledDeparture: originDepBase,
    scheduledArrival,
    predictedArrival,
    expectedDelayMinutes: delay,
    delayStatusText: formatCustomerDelay(delay),
    isDelayed: delay > 0,
    platform,
    status: displayStatus,
    direction: simTrain.direction || 'SOUTHBOUND',
    positionPct: simTrain.positionPct ?? 0,
    positionKm: simTrain.positionKm ?? 0,
    hasReachedDestination: Boolean(simTrain.hasReachedDestination),
    isDwelling: Boolean(simTrain.isDwelling)
  };
}

/**
 * Filter live simulation trains for customer journey search FROM -> TO
 */
export function searchJourneys(allTrains = [], fromStationId, toStationId, simTime = '14:20:00', simTimeSec = 51600, mlPredictions = {}) {
  const fromIdx = STATION_CHAIN.indexOf(fromStationId);
  const toIdx = STATION_CHAIN.indexOf(toStationId);

  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
    return {
      fromStation: STATIONS[fromStationId]?.name || 'Origin',
      toStation: STATIONS[toStationId]?.name || 'Destination',
      trips: []
    };
  }

  const isSouthbound = toIdx > fromIdx;
  const fromStation = STATIONS[fromStationId];
  const toStation = STATIONS[toStationId];
  const legDistanceKm = Math.abs(toStation.kmPost - fromStation.kmPost);

  // Filter trains that serve this corridor segment
  const matchingTrains = allTrains.filter(t => {
    if (t.hasReachedDestination) return false;
    if (t.direction !== (isSouthbound ? 'SOUTHBOUND' : 'NORTHBOUND')) return false;

    const oIdx = STATION_CHAIN.indexOf(t.origin);
    const dIdx = STATION_CHAIN.indexOf(t.destination);
    if (oIdx === -1 || dIdx === -1) return false;

    if (isSouthbound) {
      return oIdx <= fromIdx && dIdx >= toIdx;
    } else {
      return oIdx >= fromIdx && dIdx <= toIdx;
    }
  });

  const trips = matchingTrains.map(rawTrain => {
    const custTrain = transformTrainForCustomer(rawTrain, simTime, simTimeSec, mlPredictions);
    const speed = custTrain.currentSpeedKmH > 0 ? custTrain.currentSpeedKmH : custTrain.targetSpeed;
    const legTransitMins = Math.max(5, Math.round((legDistanceKm / speed) * 60));

    // Calculate leg departure and arrival
    const distToFromStation = Math.abs((fromStation.kmPost || 0) - (custTrain.positionKm || 0));
    const minsToFromStation = Math.round((distToFromStation / speed) * 60);

    const legDeparture = formatClockTime(simTime, minsToFromStation);
    const legArrival = formatClockTime(legDeparture, legTransitMins);
    const legPredictedArrival = formatClockTime(legArrival, custTrain.expectedDelayMinutes);

    return {
      ...custTrain,
      searchOrigin: fromStation.name,
      searchDestination: toStation.name,
      legDeparture,
      legArrival,
      legPredictedArrival,
      legDistanceKm
    };
  });

  // Sort by predicted arrival
  trips.sort((a, b) => {
    const aTime = a.legPredictedArrival || a.predictedArrival || '99:99';
    const bTime = b.legPredictedArrival || b.predictedArrival || '99:99';
    return aTime.localeCompare(bTime);
  });

  return {
    fromStation: fromStation.name,
    toStation: toStation.name,
    trips
  };
}

/**
 * Filter live simulation trains for a specific station arrivals board
 */
export function getStationArrivals(allTrains = [], stationId, simTime = '14:20:00', simTimeSec = 51600, mlPredictions = {}, stationStates = {}) {
  const station = STATIONS[stationId];
  if (!station) return { stationId, stationName: stationId, arrivals: [] };

  const targetKm = station.kmPost;
  const targetIdx = STATION_CHAIN.indexOf(stationId);

  const relevantTrains = allTrains.filter(t => {
    if (t.hasReachedDestination) return false;
    const oIdx = STATION_CHAIN.indexOf(t.origin);
    const dIdx = STATION_CHAIN.indexOf(t.destination);
    if (oIdx === -1 || dIdx === -1) return false;

    // Check if station is on train's route
    const isSouth = t.direction === 'SOUTHBOUND';
    const isEnRoute = isSouth ? (oIdx <= targetIdx && dIdx >= targetIdx) : (oIdx >= targetIdx && dIdx <= targetIdx);
    if (!isEnRoute) return false;

    // Check if already passed
    if (t.isDwelling && t.currentStation === stationId) return true;
    if (isSouth && (t.positionKm ?? 0) > targetKm + 1) return false;
    if (!isSouth && (t.positionKm ?? 232) < targetKm - 1) return false;

    return true;
  });

  const arrivals = relevantTrains.map(rawTrain => {
    const custTrain = transformTrainForCustomer(rawTrain, simTime, simTimeSec, mlPredictions);
    const isAtStation = rawTrain.isDwelling && rawTrain.currentStation === stationId;
    const speed = custTrain.currentSpeedKmH > 0 ? custTrain.currentSpeedKmH : custTrain.targetSpeed;
    const distToStation = Math.abs(targetKm - (custTrain.positionKm || 0));

    let estSecToStation = 0;
    if (!isAtStation) {
      estSecToStation = speed > 0 ? Math.round((distToStation / speed) * 3600) : 600;
    }

    const predictedEta = isAtStation 
      ? formatClockTime(simTime, 0)
      : formatAbsoluteETA(simTimeSec, estSecToStation + custTrain.expectedDelayMinutes * 60);

    const scheduledEta = isAtStation
      ? formatClockTime(simTime, -custTrain.expectedDelayMinutes)
      : formatAbsoluteETA(simTimeSec, estSecToStation);

    // Platform from station state if available
    let platform = custTrain.platform;
    const platData = stationStates[stationId]?.platforms;
    if (platData) {
      const foundPlat = Object.entries(platData).find(([pId, p]) => p.trainId === rawTrain.id || p.reservedForTrainId === rawTrain.id);
      if (foundPlat) {
        platform = `Platform ${foundPlat[0].replace('p', '')}`;
      }
    }

    return {
      id: custTrain.id,
      trainNumber: custTrain.trainNumber,
      type: custTrain.type,
      typeLabel: custTrain.typeLabel,
      origin: custTrain.origin,
      destination: custTrain.destination,
      scheduledEta,
      predictedEta,
      platform,
      delayMinutes: custTrain.expectedDelayMinutes,
      delayStatusText: isAtStation ? 'At Station' : custTrain.delayStatusText,
      isDelayed: custTrain.isDelayed,
      status: custTrain.status,
      currentSpeedKmH: custTrain.currentSpeedKmH
    };
  });

  arrivals.sort((a, b) => (a.predictedEta || '99:99').localeCompare(b.predictedEta || '99:99'));

  return {
    stationId,
    stationName: station.name,
    stationCode: station.code,
    arrivals
  };
}
