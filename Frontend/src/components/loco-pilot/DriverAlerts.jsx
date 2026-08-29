import React from 'react';

export default function DriverAlerts({ alerts = [] }) {
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
    <div className="loco-panel-card loco-alerts-card">
      {/* Panel Toolbar */}
      <div className="loco-panel-toolbar font-mono">
        <div className="toolbar-left">
          <span className="live-pulse-dot is-alert-dot"></span>
          <span className="toolbar-title">CAB DRIVER ADVISORY & WARNINGS</span>
        </div>
        <span className="cr-panel-count font-mono">({alerts.length} NOTIFICATIONS)</span>
      </div>

      {/* Alerts List */}
      <div className="loco-alerts-list">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`loco-alert-item ${getSeverityBadgeClass(alert.severity)}`}
          >
            <div className="alert-top-row">
              <span className={`alert-severity-tag font-mono ${getSeverityBadgeClass(alert.severity)}`}>
                {alert.severity}
              </span>
              <div className="alert-meta-tags font-mono">
                <span className="alert-section-tag">{alert.location}</span>
                <span className="alert-time-tag">{alert.timestamp}</span>
              </div>
            </div>

            <div className="alert-event-title font-bold">
              {alert.title}
            </div>

            <p className="alert-event-desc">
              {alert.description}
            </p>
          </div>
        ))}
      </div>

      <div className="cr-panel-footer font-mono">
        <span>Audible cab chime synchronized with ETCS Level 2 DMI acoustic buzzer.</span>
      </div>
    </div>
  );
}
