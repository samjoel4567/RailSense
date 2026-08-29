import React from 'react';

export default function StationAlerts({ 
  alerts = [], 
  selectedEntity, 
  onSelectAlert 
}) {
  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'WARNING':
        return 'alert-severity-badge sev-warning';
      case 'PREDICTION':
        return 'alert-severity-badge sev-prediction';
      case 'NORMAL':
      default:
        return 'alert-severity-badge sev-normal';
    }
  };

  return (
    <div className="cr-panel-card sm-alerts-card">
      {/* Panel Header */}
      <div className="cr-panel-header">
        <div className="cr-panel-title-group">
          <span className="cr-panel-indicator is-alert-indicator"></span>
          <h3 className="cr-panel-title">STATION & CORRIDOR OPERATIONAL ALERTS</h3>
          <span className="cr-panel-count font-mono">({alerts.length})</span>
        </div>
        <span className="cr-panel-sub font-mono">STATION B ➔ SECTION B ➔ STATION C</span>
      </div>

      {/* Alerts List */}
      <div className="cr-alerts-list">
        {alerts.map((alert) => {
          const isSelected = selectedEntity === alert.id || selectedEntity === alert.trainId;
          return (
            <div 
              key={alert.id}
              className={`cr-alert-item ${getSeverityBadgeClass(alert.severity)} ${isSelected ? 'is-selected-alert' : ''}`}
              onClick={() => onSelectAlert && onSelectAlert(alert)}
            >
              {/* Top Meta Row */}
              <div className="alert-top-row">
                <span className={`alert-severity-tag font-mono ${getSeverityBadgeClass(alert.severity)}`}>
                  {alert.severity}
                </span>

                <div className="alert-meta-tags font-mono">
                  <span className="alert-section-tag">{alert.location}</span>
                  {alert.trainId && (
                    <span className="alert-train-tag">{alert.trainId}</span>
                  )}
                  <span className="alert-time-tag">{alert.timestamp}</span>
                </div>
              </div>

              {/* Title */}
              <div className="alert-event-title">
                {alert.title}
              </div>

              {/* Description */}
              <p className="alert-event-desc">
                {alert.description}
              </p>

              {/* Recommendation */}
              {alert.recommendation && (
                <div className="alert-action-box font-mono">
                  <span className="action-prefix">STATION ADVISORY:</span>
                  <span className="action-text">{alert.recommendation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="cr-panel-footer font-mono">
        <span>Click an alert to isolate its affected corridor station and platform blocks.</span>
      </div>
    </div>
  );
}
