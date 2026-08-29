import React, { useState } from 'react';

export default function ArrivalsDepartures({ 
  items = [], 
  selectedEntity, 
  onSelectTrain 
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SOUTHBOUND' | 'NORTHBOUND'

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELAYED':
        return 'op-status-badge status-delayed';
      case 'IN SECTION B':
        return 'op-status-badge status-in-transit';
      case 'APPROACHING':
        return 'op-status-badge status-caution';
      case 'ON TIME':
      case 'NORMAL':
      default:
        return 'op-status-badge status-ontime';
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'SOUTHBOUND') return item.direction === 'Southbound';
    if (filter === 'NORTHBOUND') return item.direction === 'Northbound';
    return true;
  });

  return (
    <div className="cr-panel-card sm-arr-dep-card">
      {/* Panel Header */}
      <div className="cr-panel-header">
        <div className="cr-panel-title-group">
          <span className="cr-panel-indicator"></span>
          <h3 className="cr-panel-title">ARRIVALS & DEPARTURES (STATION B ➔ SECTION B ➔ STATION C)</h3>
          <span className="cr-panel-count font-mono">({items.length} MOVEMENTS)</span>
        </div>

        {/* Filter Toggle */}
        <div className="sm-table-filter-group font-mono">
          <button 
            className={`filter-btn ${filter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Movements
          </button>
          <button 
            className={`filter-btn ${filter === 'SOUTHBOUND' ? 'is-active' : ''}`}
            onClick={() => setFilter('SOUTHBOUND')}
          >
            Southbound (B ➔ C)
          </button>
          <button 
            className={`filter-btn ${filter === 'NORTHBOUND' ? 'is-active' : ''}`}
            onClick={() => setFilter('NORTHBOUND')}
          >
            Northbound (C ➔ B)
          </button>
        </div>
      </div>

      {/* Table List */}
      <div className="cr-table-container">
        <table className="cr-operations-table font-mono">
          <thead>
            <tr>
              <th>TRAIN ID</th>
              <th>ORIGIN</th>
              <th>DESTINATION</th>
              <th>PLATFORM</th>
              <th>DIRECTION</th>
              <th>ETA</th>
              <th>DELAY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isSelected = selectedEntity === item.trainId || selectedEntity === item.assignedPlatformId;
              return (
                <tr 
                  key={item.trainId}
                  className={`cr-table-row ${isSelected ? 'is-selected-row' : ''} ${item.status === 'DELAYED' ? 'has-delay-row' : ''}`}
                  onClick={() => onSelectTrain && onSelectTrain(item.trainId)}
                  title={`Click to focus on ${item.trainId} in the B ➔ Section B ➔ C lifecycle`}
                >
                  <td className="train-id-cell">
                    <span className="train-id-text">{item.trainId}</span>
                  </td>
                  <td className="train-station-cell">{item.origin}</td>
                  <td className="train-station-cell">{item.destination}</td>
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
        <span>Click any train to track its exact physical position across Station B, Section B, and Station C.</span>
      </div>
    </div>
  );
}
