import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ControlRoom from './components/control-room/ControlRoom';
import StationMaster from './pages/StationMaster';
import LocoPilot from './pages/LocoPilot';
import Simulator from './pages/Simulator';
import Footer from './components/Footer';
import { SimulationProvider } from './simulator/SimulationContext';
import './App.css';

function AppContent() {
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#control-room') return 'control-room';
    if (hash === '#station-master') return 'station-master';
    if (hash === '#loco-pilot') return 'loco-pilot';
    if (hash === '#simulator') return 'simulator';
    return 'home';
  });

  // Listen to hash changes if user navigates via URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#control-room') {
        setCurrentPage('control-room');
      } else if (hash === '#station-master') {
        setCurrentPage('station-master');
      } else if (hash === '#loco-pilot') {
        setCurrentPage('loco-pilot');
      } else if (hash === '#simulator') {
        setCurrentPage('simulator');
      } else if (hash === '#home' || hash === '') {
        setCurrentPage('home');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '#home' : `#${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-root">
      {/* Top Navigation */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main View: Dedicated Simulator Page, Control Room, Station Master, Loco Pilot, or Home */}
      <main className="main-content">
        {currentPage === 'simulator' ? (
          <Simulator />
        ) : currentPage === 'loco-pilot' ? (
          <LocoPilot />
        ) : currentPage === 'station-master' ? (
          <StationMaster />
        ) : currentPage === 'control-room' ? (
          <ControlRoom />
        ) : (
          <Hero onNavigate={handleNavigate} />
        )}
      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}

export default App;
