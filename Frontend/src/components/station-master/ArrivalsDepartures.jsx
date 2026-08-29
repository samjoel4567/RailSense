import React, { useState } from 'react';

export default function ArrivalsDepartures({ 
  items = [], 
  selectedTrainId, 
  onSelectTrain 
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ARRIVALS' | 'DEPARTURES'

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELAYED':
        return 'op-status-badge status-delayed';
      case 'WARNING':
        return 'op-status-badge status-warning';
      case 'MINOR DELAY':
        return 'op-status-badge status-caution';
      case 'ON TIME':
      case 'NORMAL':
      default:
        return 'op-status-badge status-ontime';
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'ARRIVALS') return item.direction === 'NORTHBOUND';
    if (filter === 'DEPARTURES') return item.direction === 'SOUTHBOUND';
    return true;
  });

  return (
    <div className="cr-panel-card sm-arr-dep-card">
      {/* Panel Header */}
      <div className="cr-panel-header">
        <div className="cr-panel-title-group">
          <span className="cr-panel-indicator"></span>
          <h3 className="cr-panel-title">ARRIVALS & DEPARTURES</h3>
          <span className="cr-panel-count font-mono">({items.length} SCHEDULED)</span>
        </div>

        {/* Filter Toggle */}
        <div className="sm-table-filter-group font-mono">
          <button 
            className={`filter-btn ${filter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'ARRIVALS' ? 'is-active' : ''}`}
            onClick={() => setFilter('ARRIVALS')}
          >
            Arrivals
          </button>
          <button 
            className={`filter-btn ${filter === 'DEPARTURES' ? 'is-active' : ''}`}
            onClick={() => setFilter('DEPARTURES')}
          >
            Departures
          </button>
        </div>
      </div>

      {/* Table List */}
      <div className="cr-table-container">
        <table className="cr-operations-table font-mono">
          <thead>
            <tr>
              <th>TRAIN ID</th>
              <th>PLATFORM</th>
              <th>DIRECTION</th>
              <th>ETA</th>
              <th>DELAY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isSelected = selectedTrainId === item.trainId;
              return (
                <tr 
                  key={item.trainId}
                  className={`cr-table-row ${isSelected ? 'is-selected-row' : ''} ${item.status === 'DELAYED' ? 'has-delay-row' : ''}`}
                  onClick={() => onSelectTrain && onSelectTrain(item.trainId)}
                  title={`Click to isolate ${item.trainId}`}
                >
                  <td className="train-id-cell">
                    <span className="train-id-text">{item.trainId}</span>
                    <span className={`type-tag type-${item.type.toLowerCase()}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="train-platform-cell">
                    <span className="plat-badge">{item.platform}</span>
                  </td>
                  <td className="train-direction-cell">
                    <span className="dir-glyph">{item.directionArrow}</span>
                    <span>{item.direction}</span>
                  </td>
                  <td className="train-eta-cell font-bold">{item.eta}</td>
                  <td className={`train-delay-cell ${item.delayMinutes > 0 ? 'text-amber font-bold' : 'text-muted'}`}>
                    {item.delay}
                  </td>
                  <td className="train-status-cell">
                    <span className={getStatusBadgeClass(item.status)}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="cr-panel-footer font-mono">
        <span>Station B dwell slots synchronized with Central Corridor Interlocking.</span>
      </div>
    </div>
  );
}
