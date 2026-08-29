import React, { useState, useEffect } from 'react';

export default function CorridorVisual({ onNavigate }) {
  // Live position state for the corridor trains
  const [trainPositions, setTrainPositions] = useState({
    exp201: { progress: 42, speed: 118, eta: '14:02:15', status: 'ON TIME' },
    loc102: { progress: 68, speed: 76, eta: '14:08:40', status: 'CAUTION' },
    loc101: { progress: 18, speed: 0, eta: '14:12:00', status: 'HOLDING' },
    exp202: { progress: 84, speed: 120, eta: '14:14:50', status: 'ON TIME' }
  });

  const [selectedTrain, setSelectedTrain] = useState('EXPRESS_201');

  // Subtle continuous motion simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTrainPositions(prev => ({
        exp201: {
          ...prev.exp201,
          progress: prev.exp201.progress >= 92 ? 10 : prev.exp201.progress + 0.35,
          speed: +(117 + Math.sin(Date.now() / 3000) * 2).toFixed(0)
        },
        loc102: {
          ...prev.loc102,
          progress: prev.loc102.progress <= 8 ? 90 : prev.loc102.progress - 0.25,
          speed: +(75 + Math.cos(Date.now() / 2500) * 1.5).toFixed(0)
        },
        loc101: {
          ...prev.loc101
        },
        exp202: {
          ...prev.exp202,
          progress: prev.exp202.progress <= 6 ? 94 : prev.exp202.progress - 0.38,
          speed: +(119 + Math.sin(Date.now() / 2800) * 1.8).toFixed(0)
        }
      }));
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="corridor-visual-section" id="corridor">
      <div className="section-container">
        
        {/* Section Header */}
        <div className="section-header-split">
          <div>
            <div className="system-tag-badge font-mono">
              <span className="badge-bullet bg-blue"></span>
              <span>CONTINUOUS PHYSICAL TELEMETRY</span>
            </div>
            <h2 className="section-title">Railway Corridor State Engine</h2>
            <p className="section-subtitle">
              Real-time multi-track topological awareness between Station B and Station C across 24.8 km.
            </p>
          </div>

          <div className="corridor-live-stats font-mono">
            <div className="stat-pill">
              <span className="stat-label">TRACK CIRCUITS:</span>
              <span className="stat-value text-green">48/48 NOMINAL</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">AXLE SENSORS:</span>
              <span className="stat-value text-green">100% ONLINE</span>
            </div>
          </div>
        </div>

        {/* Station Progression Header Bar */}
        <div className="corridor-station-timeline font-mono">
          <div className="corridor-station-node">
            <div className="st-dot"></div>
            <div className="st-info">
              <span className="st-code">STATION B</span>
              <span className="st-name">VIKHROLI (KM 0.0)</span>
            </div>
          </div>
          <div className="corridor-station-line">
            <span className="corridor-line-label">SECTION B &bull; 24.8 KM DUAL-PAIR CORRIDOR &bull; 25kV OHE</span>
          </div>
          <div className="corridor-station-node">
            <div className="st-dot"></div>
            <div className="st-info">
              <span className="st-code">STATION C</span>
              <span className="st-name">NAHUR (KM 24.8)</span>
            </div>
          </div>
        </div>

        {/* Corridor Multi-Track Diagram Board */}
        <div className="corridor-track-board">
          
          {/* Track 1: UP MAIN */}
          <div className="track-lane">
            <div className="track-lane-label font-mono">
              <span className="track-name">UP MAIN</span>
              <span className="track-dir">NORTHBOUND &uarr;</span>
            </div>
            <div className="track-line-container">
              <div className="track-rail-line"></div>
              
              {/* Train: LOCAL_102 */}
              <div 
                className={`corridor-train-marker train-local ${selectedTrain === 'LOCAL_102' ? 'is-selected' : ''}`}
                style={{ left: `${trainPositions.loc102.progress}%` }}
                onClick={() => setSelectedTrain('LOCAL_102')}
              >
                <div className="train-icon-box">
                  <span className="train-arrow">&larr;</span>
                  <span className="train-code">LOCAL_102</span>
                </div>
                <div className="train-floating-badge font-mono">
                  <span className="badge-speed">{trainPositions.loc102.speed} KM/H</span>
                  <span className="badge-sep">|</span>
                  <span className="badge-track">UP MAIN</span>
                  <span className="badge-sep">|</span>
                  <span className="badge-eta">ETA {trainPositions.loc102.eta}</span>
                </div>
              </div>

              {/* Train: EXPRESS_202 */}
              <div 
                className={`corridor-train-marker train-express ${selectedTrain === 'EXPRESS_202' ? 'is-selected' : ''}`}
                style={{ left: `${trainPositions.exp202.progress}%` }}
                onClick={() => setSelectedTrain('EXPRESS_202')}
              >
                <div className="train-icon-box">
                  <span className="train-arrow">&larr;</span>
                  <span className="train-code">EXPRESS_202</span>
                </div>
                <div className="train-floating-badge font-mono">
                  <span className="badge-speed">{trainPositions.exp202.speed} KM/H</span>
                  <span className="badge-sep">|</span>
                  <span className="badge-track">UP MAIN</span>
                  <span className="badge-sep">|</span>
                  <span className="badge-eta">ETA {trainPositions.exp202.eta}</span>
                </div>
              </div>

              {/* Signals */}
              <div className="signal-marker font-mono" style={{ left: '30%' }}>
                <span className="sig-light sig-green"></span>
                <span className="sig-id">S-02</span>
              </div>
              <div className="signal-marker font-mono" style={{ left: '70%' }}>
                <span className="sig-light sig-green"></span>
                <span className="sig-id">S-04</span>
              </div>
            </div>
          </div>

          {/* Track 2: UP LOOP */}
          <div className="track-lane track-lane-loop">
            <div className="track-lane-label font-mono">
              <span className="track-name">UP LOOP</span>
              <span className="track-dir">SIDING / CLEAR</span>
            </div>
            <div className="track-line-container">
              <div className="track-rail-line track-loop-line"></div>
              <div className="signal-marker font-mono" style={{ left: '50%' }}>
                <span className="sig-light sig-amber"></span>
                <span className="sig-id">S-08</span>
              </div>
            </div>
          </div>

          {/* Track 3: DN LOOP */}
          <div className="track-lane track-lane-loop">
            <div className="track-lane-label font-mono">
              <span className="track-name">DN LOOP</span>
              <span className="track-dir">HOLDING / SIDING</span>
            </div>
            <div className="track-line-container">
              <div className="track-rail-line track-loop-line"></div>
              
              {/* Train: LOCAL_101 Holding */}
              <div 
                className={`corridor-train-marker train-holding ${selectedTrain === 'LOCAL_101' ? 'is-selected' : ''}`}
                style={{ left: `${trainPositions.loc101.progress}%` }}
                onClick={() => setSelectedTrain('LOCAL_101')}
              >
                <div className="train-icon-box">
                  <span className="train-code">LOCAL_101 [HELD]</span>
                </div>
                <div className="train-floating-badge font-mono">
                  <span className="badge-speed">0 KM/H</span>
                  <span className="badge-sep">|</span>
                  <span className="badge-track">DN LOOP</span>
                  <span className="badge-sep">|</span>
                  <span className="badge-eta text-amber">HOLD FOR EXP_201</span>
                </div>
              </div>

              <div className="signal-marker font-mono" style={{ left: '26%' }}>
                <span className="sig-light sig-red"></span>
                <span className="sig-id">S-14 (STOP)</span>
              </div>
            </div>
          </div>

          {/* Track 4: DN MAIN */}
          <div className="track-lane">
            <div className="track-lane-label font-mono">
              <span className="track-name">DN MAIN</span>
              <span className="track-dir">SOUTHBOUND &darr;</span>
            </div>
            <div className="track-line-container">
              <div className="track-rail-line"></div>

              {/* Train: EXPRESS_201 */}
              <div 
                className={`corridor-train-marker train-express ${selectedTrain === 'EXPRESS_201' ? 'is-selected' : ''}`}
                style={{ left: `${trainPositions.exp201.progress}%` }}
                onClick={() => setSelectedTrain('EXPRESS_201')}
              >
                <div className="train-icon-box">
                  <span className="train-code">EXPRESS_201</span>
                  <span className="train-arrow">&rarr;</span>
                </div>
                <div className="train-floating-badge font-mono">
                  <span className="badge-speed">{trainPositions.exp201.speed} KM/H</span>
                  <span className="badge-sep">|</span>
                  <span className="badge-track">DN MAIN</span>
                  <span className="badge-sep">|</span>
                  <span className="badge-eta">ETA {trainPositions.exp201.eta}</span>
                </div>
              </div>

              {/* Signals */}
              <div className="signal-marker font-mono" style={{ left: '25%' }}>
                <span className="sig-light sig-green"></span>
                <span className="sig-id">S-19</span>
              </div>
              <div className="signal-marker font-mono" style={{ left: '65%' }}>
                <span className="sig-light sig-green"></span>
                <span className="sig-id">S-21</span>
              </div>
            </div>
          </div>

        </div>

        {/* Live Train Detail Strip */}
        <div className="corridor-telemetry-panel font-mono">
          <div className="panel-col">
            <span className="panel-label">SELECTED ASSET</span>
            <span className="panel-val font-bold">{selectedTrain}</span>
          </div>
          <div className="panel-col">
            <span className="panel-label">ASSIGNED TRACK</span>
            <span className="panel-val">
              {selectedTrain === 'EXPRESS_201' ? 'DN MAIN (Line 1)' :
               selectedTrain === 'LOCAL_102' ? 'UP MAIN (Line 2)' :
               selectedTrain === 'LOCAL_101' ? 'DN LOOP (Holding Platform 3)' : 'UP MAIN (Line 2)'}
            </span>
          </div>
          <div className="panel-col">
            <span className="panel-label">BRAKE SYSTEM</span>
            <span className="panel-val text-green">NOMINAL (ETCS L2 ACTIVE)</span>
          </div>
          <div className="panel-col">
            <span className="panel-label">DISPATCH ACTION</span>
            <button 
              className="btn-link-sim"
              onClick={() => onNavigate && onNavigate('control-room')}
            >
              <span>View in Control Room &rarr;</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
