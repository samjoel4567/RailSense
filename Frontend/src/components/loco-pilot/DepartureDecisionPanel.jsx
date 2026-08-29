import React from 'react';

export default function DepartureDecisionPanel({
  workflow = {},
  onRequestDeparture,
  onKeepWaiting,
  onConfirmDepart
}) {
  const {
    trainId = 'LOCAL_101',
    departureState = 'WAITING',
    location = 'Station B / Platform 1',
    destination = 'Station C',
    junction = 'J-02',
    expressEta = '--:--',
    headwayStatus = 'UNSAFE',
    routeStatus = 'LOCKED',
    riskScore = 68,
    riskCategory = 'HIGH',
    recommendation = 'WAIT',
    authorized = false,
    reason = '',
    estimatedClearanceTime = '--:--'
  } = workflow;

  const isDeparted = departureState === 'DEPARTED' || departureState === 'ARRIVED';
  const isHeld = departureState === 'HELD';
  const isAuthorized = departureState === 'AUTHORIZED' || (authorized && !isDeparted);

  return (
    <div className="loco-panel-card departure-decision-card" style={{ marginBottom: '1.25rem' }}>
      {/* Header */}
      <div className="loco-panel-toolbar font-mono">
        <div className="toolbar-left">
          <span className={`live-pulse-dot ${isDeparted ? 'is-green-dot' : isHeld ? 'is-red-dot' : 'is-alert-dot'}`}></span>
          <span className="toolbar-title font-bold">LOCO PILOT DISPATCH & DEPARTURE DECISION WORKFLOW</span>
        </div>
        <span
          className="dmi-mode-pill"
          style={{
            background: isDeparted ? '#065f46' : isAuthorized ? '#15803d' : '#991b1b',
            color: '#ffffff',
            fontWeight: 'bold'
          }}
        >
          {isDeparted ? 'IN TRANSIT' : isAuthorized ? 'DEPARTURE AUTHORIZED' : isHeld ? 'MOVEMENT HELD' : 'AWAITING DISPATCH'}
        </span>
      </div>

      <div className="departure-decision-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Core Decision Grid */}
        <div
          className="decision-metrics-grid font-mono"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.85rem'
          }}
        >
          <div className="safety-cell">
            <span className="safety-lbl">TRAIN IDENTITY</span>
            <span className="safety-val text-yellow font-bold">{trainId}</span>
            <span className="safety-sub">COMMUTER SHUTTLE</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">CURRENT LOCATION</span>
            <span className="safety-val font-bold">{location}</span>
            <span className="safety-sub">ORIGIN BERTH</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">DESTINATION</span>
            <span className="safety-val font-bold">{destination}</span>
            <span className="safety-sub">VIA SECTION B</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">EXPRESS_201 ETA TO J-02</span>
            <span className={`safety-val font-bold ${expressEta === 'ARRIVED' ? 'text-green' : 'text-yellow'}`}>
              {expressEta}
            </span>
            <span className="safety-sub">APPROACHING JUNCTION</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">INTERLOCKING JUNCTION</span>
            <span className="safety-val font-bold">{junction}</span>
            <span className="safety-sub">CONFLICT MERGE POINT</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">HEADWAY STATUS</span>
            <span className={`safety-val font-bold ${headwayStatus === 'SAFE' ? 'text-green' : 'text-red'}`}>
              {headwayStatus}
            </span>
            <span className="safety-sub">SEPARATION SAFETY</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">CORRIDOR ROUTE</span>
            <span className={`safety-val font-bold ${routeStatus === 'AVAILABLE' ? 'text-green' : 'text-amber'}`}>
              {routeStatus}
            </span>
            <span className="safety-sub">SECTION B DOWN</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">CONFLICT RISK</span>
            <span className={`safety-val font-bold ${riskScore > 50 ? 'text-red' : 'text-green'}`}>
              {riskScore} / 100 ({riskCategory})
            </span>
            <span className="safety-sub">ADA-SIL4 EVALUATOR</span>
          </div>
        </div>

        {/* Dynamic Recommendation Banner */}
        <div
          className="recommendation-banner font-mono"
          style={{
            background: isDeparted
              ? 'rgba(16, 185, 129, 0.12)'
              : recommendation === 'PROCEED'
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${
              isDeparted
                ? '#10b981'
                : recommendation === 'PROCEED'
                  ? '#22c55e'
                  : '#ef4444'
            }`,
            borderRadius: '6px',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SYSTEM RECOMMENDATION:</span>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: isDeparted ? '#10b981' : recommendation === 'PROCEED' ? '#22c55e' : '#f87171',
                  background: isDeparted ? '#064e3b' : recommendation === 'PROCEED' ? '#14532d' : '#7f1d1d',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px'
                }}
              >
                {isDeparted ? 'TRANSIT IN PROGRESS' : recommendation}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: '500' }}>
              {isDeparted 
                ? 'LOCAL_101 is actively traversing Section B towards Station C.' 
                : reason || (recommendation === 'PROCEED' ? 'Route is clear. Proceed with departure authorization.' : 'Express approaching conflict point. Hold train at Platform 1.')}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>ESTIMATED CLEARANCE</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#38bdf8' }}>{estimatedClearanceTime}</span>
          </div>
        </div>

        {/* Action Controls */}
        {!isDeparted ? (
          <div className="decision-actions-row font-mono" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Request Departure Button */}
            <button
              className="action-btn request-btn"
              onClick={onRequestDeparture}
              style={{
                flex: '1',
                minWidth: '180px',
                background: '#2563eb',
                color: '#ffffff',
                border: '1px solid #3b82f6',
                padding: '0.75rem 1.25rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>📡</span>
              <span>REQUEST DEPARTURE</span>
            </button>

            {/* Keep Waiting Button */}
            <button
              className="action-btn wait-btn"
              onClick={onKeepWaiting}
              style={{
                flex: '1',
                minWidth: '180px',
                background: '#334155',
                color: '#e2e8f0',
                border: '1px solid #475569',
                padding: '0.75rem 1.25rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>⏳</span>
              <span>KEEP WAITING</span>
            </button>

            {/* Confirm Depart Button (Active when authorized) */}
            {isAuthorized && (
              <button
                className="action-btn depart-btn"
                onClick={onConfirmDepart}
                style={{
                  flex: '1.2',
                  minWidth: '200px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: '2px solid #4ade80',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                }}
              >
                <span>🚆</span>
                <span>DEPART (EXECUTE MOVEMENT)</span>
              </button>
            )}
          </div>
        ) : (
          <div
            className="in-transit-notice font-mono"
            style={{
              padding: '0.65rem 1rem',
              background: '#064e3b',
              border: '1px solid #059669',
              borderRadius: '6px',
              color: '#6ee7b7',
              fontSize: '0.85rem',
              textAlign: 'center'
            }}
          >
            ✓ LOCAL_101 MOVEMENT ACTIVE — Platform 1 (Station B) Vacated & Section B Interlocking Engaged
          </div>
        )}

      </div>
    </div>
  );
}
