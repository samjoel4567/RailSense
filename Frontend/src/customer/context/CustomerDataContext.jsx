import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useSimulation } from '../../simulator/SimulationContext';
import {
  transformTrainForCustomer,
  searchJourneys,
  getStationArrivals,
  PASSENGER_STATIONS
} from '../services/customerApi';

const CustomerDataContext = createContext(null);

export function CustomerDataProvider({ children }) {
  // Access single unified simulation state & ML predictions
  const { state, mlStatus } = useSimulation();

  const allTrains = state?.allTrains || [];
  const stationStates = state?.stationStates || {};
  const simTime = state?.simTime || '14:20:00';
  const simTimeSec = state?.simTimeSec || 51600;
  const mlPredictions = mlStatus?.predictionsByTrain || {};
  const isLiveBackend = Boolean(mlStatus?.isConnected);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'trains' | 'stations' | 'map' | 'my-journey'
  const [selectedTrainId, setSelectedTrainId] = useState(null);
  const [selectedStationId, setSelectedStationId] = useState('STATION_B');

  // Search State
  const [searchParams, setSearchParams] = useState({
    fromStationId: 'STATION_B',
    toStationId: 'STATION_E',
    date: 'Today'
  });

  // Saved / Pinned trains in "My Journey"
  const [pinnedTrainIds, setPinnedTrainIds] = useState(() => {
    try {
      const saved = localStorage.getItem('railsense_pinned_trains');
      return saved ? JSON.parse(saved) : ['EXPRESS_201'];
    } catch {
      return ['EXPRESS_201'];
    }
  });

  const togglePinTrain = useCallback((trainId) => {
    setPinnedTrainIds(prev => {
      const exists = prev.includes(trainId);
      const next = exists ? prev.filter(id => id !== trainId) : [...prev, trainId];
      try {
        localStorage.setItem('railsense_pinned_trains', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Swap From and To stations
  const swapSearchStations = useCallback(() => {
    setSearchParams(prev => ({
      ...prev,
      fromStationId: prev.toStationId,
      toStationId: prev.fromStationId
    }));
  }, []);

  // Transform all 30 live simulation trains into customer presentation objects
  const trains = useMemo(() => {
    return allTrains.map(t => transformTrainForCustomer(t, simTime, simTimeSec, mlPredictions)).filter(Boolean);
  }, [allTrains, simTime, simTimeSec, mlPredictions]);

  // Dynamically calculate Search Results from live simulation train routes
  const searchResults = useMemo(() => {
    if (!searchParams.fromStationId || !searchParams.toStationId) return null;
    return searchJourneys(
      allTrains,
      searchParams.fromStationId,
      searchParams.toStationId,
      simTime,
      simTimeSec,
      mlPredictions
    );
  }, [allTrains, searchParams.fromStationId, searchParams.toStationId, simTime, simTimeSec, mlPredictions]);

  // Dynamically calculate Station Arrivals for selected station
  const stationArrivalsData = useMemo(() => {
    if (!selectedStationId) return null;
    return getStationArrivals(
      allTrains,
      selectedStationId,
      simTime,
      simTimeSec,
      mlPredictions,
      stationStates
    );
  }, [allTrains, selectedStationId, simTime, simTimeSec, mlPredictions, stationStates]);

  // Currently selected train object for details modal
  const selectedTrain = trains.find(t => t.id === selectedTrainId) || null;

  const value = {
    activeTab,
    setActiveTab,
    stations: PASSENGER_STATIONS,
    trains,
    allSimulationTrains: allTrains,
    selectedTrain,
    selectedTrainId,
    setSelectedTrainId,
    selectedStationId,
    setSelectedStationId,
    searchParams,
    setSearchParams,
    searchResults,
    isSearching: false,
    executeSearch: (fromId, toId) => setSearchParams(prev => ({ ...prev, fromStationId: fromId, toStationId: toId })),
    swapSearchStations,
    stationArrivalsData,
    fetchStationArrivals: (stId) => setSelectedStationId(stId),
    pinnedTrainIds,
    togglePinTrain,
    isLoadingInitial: false,
    isLiveBackend,
    simTime,
    dataStatus: isLiveBackend ? 'LIVE' : 'SIMULATOR',
    secondsAgo: 0
  };

  return (
    <CustomerDataContext.Provider value={value}>
      {children}
    </CustomerDataContext.Provider>
  );
}

export function useCustomerData() {
  const context = useContext(CustomerDataContext);
  if (!context) {
    throw new Error('useCustomerData must be used within a CustomerDataProvider');
  }
  return context;
}
