import React from 'react';
import { useCustomerData } from '../context/CustomerDataContext';

export default function StationArrivals({ onSelectTrain }) {
  const {
    stations,
    selectedStationId,
    setSelectedStationId,
    stationArrivalsData,
    isLiveBackend
  } = useCustomerData();

  const currentStation = stations.find(s => s.id === selectedStationId) || stations[1];
  const arrivals = stationArrivalsData?.arrivals || [];

  return (
    <div className="station-arrivals-container">
      {/* Station Selector Bar */}
      <div className="station-selector-header">
        <div className="selector-title-group">
          <span className="selector-badge font-mono">LIVE STATION BOARD</span>
          <h2 className="selector-heading">
            {currentStation.name} <span className="text-muted font-mono">({currentStation.code})</span>
          </h2>
          <p className="selector-sub">
            Real-time platform arrivals sorted by continuous ML-predicted arrival time.
          </p>
        </div>

        {/* Station Dropdown */}
        <div className="station-picker font-mono">
          <label htmlFor="station-board-select">CHANGE STATION:</label>
          <select
            id="station-board-select"
            className="station-board-dropdown"
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
          >
            {stations.map(st => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.code}) — {st.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Station Chips */}
      <div className="station-chips-row font-mono">
        {stations.map(st => (
          <button
            key={st.id}
            type="button"
            className={`st-chip ${st.id === selectedStationId ? 'is-active-chip' : ''}`}
            onClick={() => setSelectedStationId(st.id)}
          >
            <span className="st-chip-code">{st.shortName}</span>
            <span>{st.name}</span>
          </button>
        ))}
      </div>

      {/* Live Board Table / Card View */}
      <div className="arrivals-board-wrap">
        <div className="board-header-row font-mono">
          <span className="col-train">TRAIN</span>
          <span className="col-dest">DESTINATION</span>
          <span className="col-sched">SCHEDULED</span>
          <span className="col-pred">PREDICTED ETA</span>
          <span className="col-plat">PLATFORM</span>
          <span className="col-status">STATUS</span>
          <span className="col-action">ACTION</span>
        </div>

        {arrivals.length === 0 ? (
          <div className="board-empty-state font-mono">
            <span className="empty-icon">🚆</span>
            <p>No trains currently approaching {currentStation.name}.</p>
          </div>
        ) : (
          arrivals.map(arr => {
            const isDelayed = arr.delayMinutes > 0;
            return (
              <div
                key={arr.id}
                className={`board-arrival-row ${isDelayed ? 'row-delayed' : ''}`}
                onClick={() => onSelectTrain(arr.id)}
              >
                <div className="col-train">
                  <div className="train-id-pill font-mono font-bold">
                    <span className="dot-type" />
                    <span>{arr.id}</span>
                  </div>
                  <span className="train-type-sub font-mono">{arr.typeLabel}</span>
                </div>

                <div className="col-dest font-bold">
                  <span>{arr.destination}</span>
                  <span className="origin-sub font-mono">From {arr.origin}</span>
                </div>

                <div className="col-sched font-mono text-muted">
                  {arr.scheduledEta}
                </div>

                <div className="col-pred font-mono">
                  <strong className="pred-time-highlight font-bold">{arr.predictedEta}</strong>
                  {isDelayed && (
                    <span className="pred-delay-tag font-mono">+{arr.delayMinutes}m expected</span>
                  )}
                </div>

                <div className="col-plat font-mono font-bold">
                  {arr.platform}
                </div>

                <div className="col-status font-mono">
                  <span className={`status-pill ${isDelayed ? 'pill-delayed' : 'pill-ontime'}`}>
                    {arr.delayStatusText}
                  </span>
                </div>

                <div className="col-action">
                  <button
                    type="button"
                    className="btn-board-details font-mono"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTrain(arr.id);
                    }}
                  >
                    DETAILS ➔
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="board-footer-note font-mono">
        <span className="live-dot-pulse" />
        <span>Live arrivals synchronized with Simulation State • Digital Twin Corridor</span>
      </div>
    </div>
  );
}
