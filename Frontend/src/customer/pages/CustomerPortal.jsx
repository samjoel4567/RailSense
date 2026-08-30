import React, { useState } from 'react';
import CustomerNavbar from '../components/CustomerNavbar';
import JourneySearch from '../components/JourneySearch';
import TrainCard from '../components/TrainCard';
import TrainDetailsModal from '../components/TrainDetailsModal';
import LiveTrainMap from '../components/LiveTrainMap';
import StationArrivals from '../components/StationArrivals';
import { useCustomerData } from '../context/CustomerDataContext';
import '../styles/customer.css';

export default function CustomerPortal({ onSwitchToOperator }) {
  const {
    activeTab,
    setActiveTab,
    trains,
    searchResults,
    isSearching,
    selectedTrainId,
    setSelectedTrainId,
    setSelectedStationId,
    pinnedTrainIds,
    isLiveBackend,
    secondsAgo
  } = useCustomerData();

  const [liveTrainsFilter, setLiveTrainsFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Filter for the "All Live Trains" tab
  const filteredAllTrains = trains.filter(t => {
    const matchesText = !liveTrainsFilter || (
      t.id.toLowerCase().includes(liveTrainsFilter.toLowerCase()) ||
      t.origin.toLowerCase().includes(liveTrainsFilter.toLowerCase()) ||
      t.destination.toLowerCase().includes(liveTrainsFilter.toLowerCase()) ||
      t.type.toLowerCase().includes(liveTrainsFilter.toLowerCase())
    );
    const matchesType = selectedTypeFilter === 'ALL' || t.type === selectedTypeFilter;
    return matchesText && matchesType;
  });

  // Pinned trains list
  const pinnedTrains = trains.filter(t => pinnedTrainIds.includes(t.id));

  // Network stats
  const delayedCount = trains.filter(t => (t.expectedDelayMinutes || 0) > 0).length;
  const onTimePct = trains.length > 0 ? Math.round(((trains.length - delayedCount) / trains.length) * 100) : 100;

  return (
    <div className="customer-portal-app">
      {/* Top Passenger Navbar */}
      <CustomerNavbar onSwitchToOperator={onSwitchToOperator} />

      {/* Main Passenger Content Area */}
      <main className="cust-main-content">
        
        {/* ── TAB 1: JOURNEY PLANNER (HOME) ────────────────────── */}
        {activeTab === 'planner' && (
          <div className="tab-pane pane-planner">
            <div className="pane-container">
              
              {/* Journey Search Hero */}
              <JourneySearch />

              {/* Search Results / Trips Available */}
              <section className="search-results-section" id="search-results">
                <div className="results-header-bar font-mono">
                  <div className="results-title-group">
                    <span className="results-count-badge">
                      {searchResults?.trips?.length ?? 0} TRIPS AVAILABLE
                    </span>
                    <h2 className="results-heading font-sans font-bold">
                      {searchResults?.fromStation || 'Station B'} ➔ {searchResults?.toStation || 'Station E'}
                    </h2>
                  </div>

                  <div className="results-live-indicator">
                    <span className="dot-live-ping" />
                    <span>Continuously updated ETA</span>
                  </div>
                </div>

                {isSearching ? (
                  <div className="results-loading-state font-mono">
                    <div className="loading-spinner" />
                    <span>Searching live trains and calculating real-time ETAs...</span>
                  </div>
                ) : searchResults && searchResults.trips.length > 0 ? (
                  <div className="train-cards-list">
                    {searchResults.trips.map(trip => (
                      <TrainCard
                        key={trip.id}
                        trip={trip}
                        onSelectDetails={(id) => setSelectedTrainId(id)}
                      />
                    ))}
                  </div>
                ) : searchResults && searchResults.trips.length === 0 ? (
                  <div className="no-trips-card font-mono">
                    <span className="no-trips-icon">🚆</span>
                    <h3>No direct trains currently match this journey segment.</h3>
                    <p>Try searching between adjacent sectors or view all 30 live trains running on the network.</p>
                    <button
                      type="button"
                      className="btn-view-all-trains"
                      onClick={() => setActiveTab('trains')}
                    >
                      VIEW ALL LIVE TRAINS ➔
                    </button>
                  </div>
                ) : null}
              </section>

              {/* Quick Network Performance Summary */}
              <section className="passenger-network-summary">
                <div className="net-summary-card">
                  <div className="summary-col">
                    <span className="summary-label font-mono">LIVE TRAINS</span>
                    <span className="summary-val font-mono">{trains.length}</span>
                    <span className="summary-desc font-mono">30 Active on corridor</span>
                  </div>
                  <div className="summary-col">
                    <span className="summary-label font-mono">ON-TIME PERFORMANCE</span>
                    <span className="summary-val font-mono text-green">{onTimePct}%</span>
                    <span className="summary-desc font-mono">ETA precision validated</span>
                  </div>
                  <div className="summary-col">
                    <span className="summary-label font-mono">CORRIDOR STATUS</span>
                    <span className="summary-val font-mono text-blue">OPERATIONAL</span>
                    <span className="summary-desc font-mono">10 Passenger Stations</span>
                  </div>
                </div>
              </section>

            </div>
          </div>
        )}

        {/* ── TAB 2: ALL LIVE TRAINS ───────────────────────────── */}
        {activeTab === 'trains' && (
          <div className="tab-pane pane-trains">
            <div className="pane-container">
              
              <div className="pane-header-group">
                <span className="pane-badge font-mono">LIVE RAILWAY TRAFFIC</span>
                <h1 className="pane-title">All 30 Active Corridor Trains</h1>
                <p className="pane-sub">
                  Continuously updated telemetry and ML arrival predictions for all passenger services.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="trains-filter-bar font-mono">
                <div className="filter-input-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="filter-text-input"
                    placeholder="Search by train number, type, or station..."
                    value={liveTrainsFilter}
                    onChange={(e) => setLiveTrainsFilter(e.target.value)}
                  />
                  {liveTrainsFilter && (
                    <button type="button" className="btn-clear-search" onClick={() => setLiveTrainsFilter('')}>
                      ✕
                    </button>
                  )}
                </div>

                <div className="type-filter-buttons">
                  {['ALL', 'EXPRESS', 'INTERCITY', 'REGIONAL', 'LOCAL', 'COMMUTER'].map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`type-filter-btn ${selectedTypeFilter === type ? 'is-active' : ''}`}
                      onClick={() => setSelectedTypeFilter(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Train Cards List */}
              <div className="train-cards-list">
                {filteredAllTrains.map(train => (
                  <TrainCard
                    key={train.id}
                    trip={train}
                    onSelectDetails={(id) => setSelectedTrainId(id)}
                  />
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ── TAB 3: STATIONS BOARD ────────────────────────────── */}
        {activeTab === 'stations' && (
          <div className="tab-pane pane-stations">
            <div className="pane-container">
              <StationArrivals
                onSelectTrain={(id) => setSelectedTrainId(id)}
              />
            </div>
          </div>
        )}

        {/* ── TAB 4: LIVE MAP ──────────────────────────────────── */}
        {activeTab === 'map' && (
          <div className="tab-pane pane-map">
            <div className="pane-container">
              <LiveTrainMap
                onSelectTrain={(id) => setSelectedTrainId(id)}
                onSelectStation={(stId) => {
                  setSelectedStationId(stId);
                  setActiveTab('stations');
                }}
              />
            </div>
          </div>
        )}

        {/* ── TAB 5: MY JOURNEY (PINNED TRAINS) ────────────────── */}
        {activeTab === 'my-journey' && (
          <div className="tab-pane pane-my-journey">
            <div className="pane-container">
              
              <div className="pane-header-group">
                <span className="pane-badge font-mono">SAVED TRIPS</span>
                <h1 className="pane-title">My Tracked Journeys</h1>
                <p className="pane-sub">
                  Live monitoring and real-time arrival alerts for your pinned trains.
                </p>
              </div>

              {pinnedTrains.length === 0 ? (
                <div className="empty-pinned-card font-mono">
                  <span className="empty-star">★</span>
                  <h3>No pinned journeys yet</h3>
                  <p>Pin any train using the "☆ PIN" button on train cards to track its live ETA here.</p>
                  <button
                    type="button"
                    className="btn-view-all-trains"
                    onClick={() => setActiveTab('planner')}
                  >
                    SEARCH TRAINS ➔
                  </button>
                </div>
              ) : (
                <div className="train-cards-list">
                  {pinnedTrains.map(train => (
                    <TrainCard
                      key={train.id}
                      trip={train}
                      onSelectDetails={(id) => setSelectedTrainId(id)}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Train Details Modal / Slide-out Panel */}
      {selectedTrainId && (
        <TrainDetailsModal
          trainId={selectedTrainId}
          onClose={() => setSelectedTrainId(null)}
        />
      )}
    </div>
  );
}
