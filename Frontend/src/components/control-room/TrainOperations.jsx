import React from 'react';

export default function TrainOperations({ 
  trains = [], 
  selectedTrainId, 
  onSelectTrain 
}) {
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

  return (
    <div className="cr-panel-card cr-train-operations">
      {/* Panel Header */}
      <div className="cr-panel-header">
        <div className="cr-panel-title-group">
          <span className="cr-panel-indicator"></span>
          <h3 className="cr-panel-title">TRAIN OPERATIONS</h3>
          <span className="cr-panel-count font-mono">({trains.length} TRACKED)</span>
        </div>
        <span className="cr-panel-sub font-mono">SCHEDULE & REAL-TIME SPEED</span>
      </div>

      {/* Operations Table */}
      <div className="cr-table-container">
        <table className="cr-operations-table font-mono">
          <thead>
            <tr>
              <th>TRAIN</th>
              <th>TYPE</th>
              <th>SECTION</th>
              <th>SPEED</th>
              <th>DELAY</th>
              <th>ETA</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {trains.map((train) => {
              const isSelected = selectedTrainId === train.id;
              return (
                <tr 
                  key={train.id}
                  className={`cr-table-row ${isSelected ? 'is-selected-row' : ''} ${train.status === 'DELAYED' ? 'has-delay-row' : ''}`}
                  onClick={() => onSelectTrain && onSelectTrain(train.id)}
                  title={`Click to focus on ${train.id}`}
                >
                  <td className="train-id-cell">
                    <span className="train-id-text">{train.id}</span>
                    <span className="train-dir-arrow">{train.directionArrow}</span>
                  </td>
                  <td className="train-type-cell">
                    <span className={`type-tag type-${train.type.toLowerCase()}`}>
                      {train.type}
                    </span>
                  </td>
                  <td className="train-section-cell">{train.section}</td>
                  <td className="train-speed-cell">
                    <span className="speed-num">{train.speed}</span>
                    <span className="speed-unit">km/h</span>
                  </td>
                  <td className={`train-delay-cell ${train.delay > 0 ? 'text-amber font-bold' : 'text-muted'}`}>
                    {train.delayFormatted}
                  </td>
                  <td className="train-eta-cell">{train.eta}</td>
                  <td className="train-status-cell">
                    <span className={getStatusBadgeClass(train.status)}>
                      {train.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Summary Tip */}
      <div className="cr-panel-footer font-mono">
        <span>TIP: Click any train row to highlight its live position and telemetry on the topology map.</span>
      </div>
    </div>
  );
}
