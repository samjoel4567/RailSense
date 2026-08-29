import React from 'react';

export default function ActiveAlerts({ 
  alerts = [], 
  selectedAlertId, 
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
    <div className="cr-panel-card cr-active-alerts">
      {/* Panel Header */}
      <div className="cr-panel-header">
        <div className="cr-panel-title-group">
          <span className="cr-panel-indicator is-alert-indicator"></span>
          <h3 className="cr-panel-title">ACTIVE OPERATIONAL ALERTS</h3>
          <span className="cr-panel-count font-mono">({alerts.length})</span>
        </div>
        <span className="cr-panel-sub font-mono">SIL-4 DISPATCH ADVISORIES</span>
      </div>

      {/* Alerts List */}
      <div className="cr-alerts-list">
        {alerts.map((alert) => {
          const isSelected = selectedAlertId === alert.id;
          return (
            <div 
              key={alert.id}
              className={`cr-alert-item ${getSeverityBadgeClass(alert.severity)} ${isSelected ? 'is-selected-alert' : ''}`}
              onClick={() => onSelectAlert && onSelectAlert(alert)}
              title="Click to highlight affected track & train"
            >
              {/* Alert Header Row */}
              <div className="alert-top-row">
                <span className={`alert-severity-tag font-mono ${getSeverityBadgeClass(alert.severity)}`}>
                  {alert.severity}
                </span>

                <div className="alert-meta-tags font-mono">
                  {alert.trainId && (
                    <span className="alert-train-tag">{alert.trainId}</span>
                  )}
                  {alert.section && (
                    <span className="alert-section-tag">{alert.section}</span>
                  )}
                  <span className="alert-time-tag">{alert.timestamp}</span>
                </div>
              </div>

              {/* Alert Event Statement */}
              <div className="alert-event-title">
                {alert.event}
              </div>

              {/* Alert Detail / Impact */}
              {alert.detail && (
                <p className="alert-event-desc">{alert.detail}</p>
              )}

              {/* Recommended Operator Action */}
              {alert.recommendedAction && (
                <div className="alert-action-box font-mono">
                  <span className="action-prefix">ACTION:</span>
                  <span className="action-text">{alert.recommendedAction}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="cr-panel-footer font-mono">
        <span>Click an alert to isolate its affected corridor segment on the map.</span>
      </div>
    </div>
  );
}
