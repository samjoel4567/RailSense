import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ControlRoom from './components/control-room/ControlRoom';
import StationMaster from './pages/StationMaster';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Listen to hash changes if user navigates via URL
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#control-room') {
        setCurrentPage('control-room');
      } else if (window.location.hash === '#station-master') {
        setCurrentPage('station-master');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-root">
      {/* Top Navigation */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main View: Locked Home Page, Control Room, or Station Master */}
      <main className="main-content">
        {currentPage === 'station-master' ? (
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

export default App;
