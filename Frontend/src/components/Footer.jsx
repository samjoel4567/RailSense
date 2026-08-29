import React from 'react';

export default function Footer() {
  return (
    <footer className="rail-footer" id="network">
      <div className="footer-wrap">
        
        {/* Top Information Row */}
        <div className="footer-main-row">
          
          <div className="footer-col-brand">
            <div className="footer-logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="5" y1="3" x2="5" y2="21" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="19" y1="3" x2="19" y2="21" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="2" y1="8" x2="22" y2="8" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
                <line x1="2" y1="16" x2="22" y2="16" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="brand-text">RAIL<span className="brand-slash">/</span>AI</span>
            </div>
            <p className="footer-mission">
              Deterministic railway decision intelligence and real-time predictive safety architecture for modern rail infrastructure.
            </p>
          </div>

          <div className="footer-spec-columns">
            <div className="spec-group">
              <span className="spec-heading font-mono">STANDARDS & CERTIFICATIONS</span>
              <ul className="spec-list font-mono">
                <li>CENELEC EN 50126 (RAMS)</li>
                <li>CENELEC EN 50128 (Software SIL-4)</li>
                <li>ERTMS / ETCS Level 2 Baseline 3</li>
                <li>IEEE 1474 CBTC Standard</li>
              </ul>
            </div>

            <div className="spec-group">
              <span className="spec-heading font-mono">DISPATCH HUBS & FEEDS</span>
              <ul className="spec-list font-mono">
                <li>Corridor North-West (High-Speed)</li>
                <li>Central Terminal Switchyard Alpha</li>
                <li>Freight Intermodal Arterial 04</li>
                <li>Regional Commuter Loop West</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Metadata Bar */}
        <div className="footer-legal-row">
          <div className="footer-copyright font-mono">
            © {new Date().getFullYear()} RAIL//AI SYSTEMS AG. ALL RIGHTS RESERVED.
          </div>
          <div className="footer-security-pill font-mono">
            <span className="security-indicator"></span>
            <span>AIR-GAPPED TELEMETRY GATEWAY // SIL-4 HARDENED</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
