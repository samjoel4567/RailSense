import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ControlRoom from './components/control-room/ControlRoom';
import StationMaster from './pages/StationMaster';
import LocoPilot from './pages/LocoPilot';
import Simulator from './pages/Simulator';
import Auth from './pages/Auth';
import Footer from './components/Footer';
import CustomerPortal from './customer/pages/CustomerPortal';
import { CustomerDataProvider } from './customer/context/CustomerDataContext';
import { SimulationProvider } from './simulator/SimulationContext';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import './App.css';

function AppContent() {
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash === '#auth' || path === '/auth') return 'auth';
    if (hash === '#passenger' || path === '/passenger' || hash === '#journey' || path === '/journey') return 'passenger';
    if (hash === '#control-room' || path === '/control-room') return 'control-room';
    if (hash === '#station-master' || path === '/station-master') return 'station-master';
    if (hash === '#loco-pilot' || path === '/loco-pilot') return 'loco-pilot';
    if (hash === '#simulator' || path === '/simulator') return 'simulator';
    return 'home';
  });

  // Listen to hash changes if user navigates via URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === '#auth' || path === '/auth') {
        setCurrentPage('auth');
      } else if (hash === '#passenger' || path === '/passenger' || hash === '#journey' || path === '/journey') {
        setCurrentPage('passenger');
      } else if (hash === '#control-room' || path === '/control-room') {
        setCurrentPage('control-room');
      } else if (hash === '#station-master' || path === '/station-master') {
        setCurrentPage('station-master');
      } else if (hash === '#loco-pilot' || path === '/loco-pilot') {
        setCurrentPage('loco-pilot');
      } else if (hash === '#simulator' || path === '/simulator') {
        setCurrentPage('simulator');
      } else if (hash === '#home' || hash === '' || path === '/') {
        setCurrentPage('home');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '#home' : `#${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPassengerPage = currentPage === 'passenger';

  return (
    <div className="app-root">
      {/* Top Navigation - shown on operator pages */}
      {!isPassengerPage && (
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      )}

      {/* Main View: Passenger Portal, Auth, Simulator, Loco Pilot, Station Master, Control Room, or Home */}
      <main className="main-content">
        {currentPage === 'passenger' ? (
          <CustomerDataProvider>
            <CustomerPortal onSwitchToOperator={() => handleNavigate('home')} />
          </CustomerDataProvider>
        ) : currentPage === 'auth' ? (
          <Auth onNavigate={handleNavigate} />
        ) : currentPage === 'simulator' ? (
          <ProtectedRoute
            requiredRoles={['LOCO_PILOT', 'STATION_MASTER', 'CONTROL_ROOM', 'ADMIN']}
            onNavigate={handleNavigate}
            pageName="Railway Network Simulator"
          >
            <Simulator />
          </ProtectedRoute>
        ) : currentPage === 'loco-pilot' ? (
          <ProtectedRoute
            requiredRoles={['LOCO_PILOT', 'ADMIN']}
            onNavigate={handleNavigate}
            pageName="Loco Pilot DMI Cab Console"
          >
            <LocoPilot />
          </ProtectedRoute>
        ) : currentPage === 'station-master' ? (
          <ProtectedRoute
            requiredRoles={['STATION_MASTER', 'ADMIN']}
            onNavigate={handleNavigate}
            pageName="Station Master Interlocking Console"
          >
            <StationMaster />
          </ProtectedRoute>
        ) : currentPage === 'control-room' ? (
          <ProtectedRoute
            requiredRoles={['CONTROL_ROOM', 'ADMIN']}
            onNavigate={handleNavigate}
            pageName="Central Control Room Network Operations"
          >
            <ControlRoom />
          </ProtectedRoute>
        ) : (
          <Hero onNavigate={handleNavigate} />
        )}
      </main>

      {/* Shared Footer on operator pages */}
      {!isPassengerPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SimulationProvider>
        <AppContent />
      </SimulationProvider>
    </AuthProvider>
  );
}

export default App;

