import React from 'react';

export default function TrainMarker({ train, isSelected, onClick }) {
  const getStatusClass = (status) => {
    switch (status) {
      case 'DELAYED':
        return 'marker-delayed';
      case 'WARNING':
        return 'marker-warning';
      case 'MINOR DELAY':
        return 'marker-caution';
      case 'ON TIME':
      case 'NORMAL':
      default:
        return 'marker-normal';
    }
  };

  return (
    <div 
      className={`train-marker-node ${getStatusClass(train.status)} ${isSelected ? 'is-selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(train.id);
      }}
      title={`${train.name} (${train.id}) - Speed: ${train.speed} km/h - Status: ${train.status}`}
      style={{ left: `${train.coordinates.x}px`, top: `${train.coordinates.y}px` }}
    >
      {/* Visual Train Icon / Pill */}
      <div className="train-marker-body">
        <span className="marker-direction-glyph">{train.directionArrow}</span>
        <div className="marker-meta">
          <span className="marker-id font-mono">{train.id}</span>
          <span className="marker-speed font-mono">{train.speed} km/h</span>
        </div>
        {train.delay > 0 && (
          <span className="marker-delay-badge font-mono">{train.delayFormatted}</span>
        )}
      </div>

      {/* Target Indicator Ping when Selected */}
      {isSelected && <div className="marker-selection-ring"></div>}
    </div>
  );
}
