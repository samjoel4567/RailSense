import React from 'react';
import CinematicIntro from './homepage/CinematicIntro';
import SystemReveal from './homepage/SystemReveal';
import CorridorVisual from './homepage/CorridorVisual';
import PredictiveIntelligence from './homepage/PredictiveIntelligence';
import AIModelPerformance from './homepage/AIModelPerformance/AIModelPerformance';
import DelayPrevention from './homepage/DelayPrevention';
import SafetyArchitecture from './homepage/SafetyArchitecture';
import SystemLaunchpad from './homepage/SystemLaunchpad';

export default function Hero({ onNavigate }) {
  const handleScrollEnter = () => {
    const el = document.getElementById('system-reveal');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="homepage-master-root" id="home">
      {/* 1. Full-Screen Cinematic Video Intro */}
      <CinematicIntro onScrollEnter={handleScrollEnter} />

      {/* 2. System Reveal — 3 Operational Interfaces */}
      <SystemReveal onNavigate={onNavigate} />

      {/* 3. Live 4-Track Corridor Physical Telemetry Visual */}
      <CorridorVisual onNavigate={onNavigate} />

      {/* 4. Predictive Safety Intelligence Progression Pipeline */}
      <PredictiveIntelligence />

      {/* 5. Real-Time AI Model Performance & Validation */}
      <AIModelPerformance />

      {/* 6. Bottleneck & Delay Prevention Scenario Analysis */}
      <DelayPrevention onNavigate={onNavigate} />

      {/* 7. Fail-Safe Safety & Emergency Architecture */}
      <SafetyArchitecture />

      {/* 8. Final System Launchpad & Unified CTA */}
      <SystemLaunchpad onNavigate={onNavigate} />
    </div>
  );
}

