import React, { useState } from 'react';
import { useCustomerData } from '../context/CustomerDataContext';
import { STATIONS, STATION_CHAIN, SECTIONS } from '../../simulator/networkModel';

export default function LiveTrainMap({ onSelectTrain, onSelectStation }) {
  const { trains, stations, isLiveBackend } = useCustomerData();
  const [filterType, setFilterType] = useState('ALL');

  const filteredTrains = trains.filter(t => {
    if (filterType === 'ALL') return true;
    if (filterType === 'EXPRESS') return t.type === 'EXPRESS';
    if (filterType === 'INTERCITY') return t.type === 'INTERCITY';
    if (filterType === 'LOCAL') return t.type === 'LOCAL';
    if (filterType === 'DELAYED') return (t.expectedDelayMinutes || 0) > 0;
    return true;
  });

  return (
    <div className="customer-map-container">
      {/* Map Header */}
      <div className="map-header">
        <div className="map-title-group">
          <span className="map-badge font-mono">INTERACTIVE CORRIDOR MAP</span>
          <h2 className="map-heading">Live Network Overview</h2>
          <p className="map-sub">
            Track real-time train positions, direction of travel, and approaching stations along the 232 km corridor.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="map-filters font-mono">
          <button
            type="button"
            className={`map-filter-btn ${filterType === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            ALL TRAINS ({trains.length})
          </button>
          <button
            type="button"
            className={`map-filter-btn ${filterType === 'EXPRESS' ? 'is-active' : ''}`}
            onClick={() => setFilterType('EXPRESS')}
          >
            EXPRESS
          </button>
          <button
            type="button"
            className={`map-filter-btn ${filterType === 'INTERCITY' ? 'is-active' : ''}`}
            onClick={() => setFilterType('INTERCITY')}
          >
            INTERCITY
          </button>
          <button
            type="button"
            className={`map-filter-btn ${filterType === 'LOCAL' ? 'is-active' : ''}`}
            onClick={() => setFilterType('LOCAL')}
          >
            LOCAL
          </button>
          <button
            type="button"
            className={`map-filter-btn filter-delayed ${filterType === 'DELAYED' ? 'is-active' : ''}`}
            onClick={() => setFilterType('DELAYED')}
          >
            DELAYED ({trains.filter(t => (t.expectedDelayMinutes || 0) > 0).length})
          </button>
        </div>
      </div>

      {/* Main Schematic Corridor Map */}
      <div className="corridor-schematic-wrap">
        <div className="corridor-schematic-track">
          
          {/* Main Track Lines (Dual Track: Southbound & Northbound) */}
          <div className="track-rail-line track-southbound" />
          <div className="track-rail-line track-northbound" />

          {/* Stations positioned along the track */}
          <div className="stations-layer">
            {STATION_CHAIN.map((stId, index) => {
              const station = STATIONS[stId];
              const pct = (index / (STATION_CHAIN.length - 1)) * 92 + 4; // 4% to 96%
              const arrivalsCount = trains.filter(t => t.nextStation === station.name).length;

              return (
                <div
                  key={stId}
                  className="map-station-node"
                  style={{ left: `${pct}%` }}
                  onClick={() => onSelectStation && onSelectStation(stId)}
                  title={`Click to view live arrivals at ${station.name}`}
                >
                  <div className="station-pole" />
                  <div className="station-dot" />
                  <div className="station-label-block">
                    <span className="st-name font-bold">{station.name}</span>
                    <span className="st-km font-mono">{station.kmPost} km</span>
                    {arrivalsCount > 0 && (
                      <span className="st-approaching-badge font-mono">
                        {arrivalsCount} approaching
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trains Layer */}
          <div className="trains-layer">
            {filteredTrains.map((t, idx) => {
              const isSouthbound = t.direction === 'SOUTHBOUND';
              const isDelayed = (t.expectedDelayMinutes || 0) > 0;
              
              // Calculate horizontal percentage directly from live simulation positionKm (0 to 232 km)
              const kmPos = typeof t.positionKm === 'number' ? t.positionKm : 0;
              const leftPct = Math.min(96, Math.max(4, (kmPos / 232) * 92 + 4));
              const topOffset = isSouthbound ? '26%' : '66%';

              return (
                <div
                  key={t.id}
                  className={`map-train-marker ${isDelayed ? 'marker-delayed' : ''} ${isSouthbound ? 'dir-south' : 'dir-north'}`}
                  style={{ left: `${leftPct}%`, top: topOffset }}
                  onClick={() => onSelectTrain && onSelectTrain(t.id)}
                  title={`${t.id} (${t.type}) • ${t.currentSpeedKmH} km/h • Next: ${t.nextStation}`}
                >
                  <div className="train-marker-chip font-mono">
                    <span className="train-dir-arrow">{isSouthbound ? '➔' : '⬅'}</span>
                    <span className="train-marker-name font-bold">{t.id.replace('_', ' ')}</span>
                    <span className="train-marker-eta font-bold">{t.predictedArrival}</span>
                  </div>
                  {isDelayed && (
                    <span className="train-marker-delay-dot font-mono">+{t.expectedDelayMinutes}m</span>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Map Legend */}
      <div className="map-legend-strip font-mono">
        <div className="legend-item">
          <span className="legend-dot dot-south" />
          <span>Upper Track: Southbound (Station A ➔ J)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-north" />
          <span>Lower Track: Northbound (Station J ➔ A)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-delayed" />
          <span>Amber: Predicted Operational Delay</span>
        </div>
        <div className="legend-item">
          <span>Click any station or train for details</span>
        </div>
      </div>
    </div>
  );
}
