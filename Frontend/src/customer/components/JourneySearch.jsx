import React from 'react';
import { useCustomerData } from '../context/CustomerDataContext';

export default function JourneySearch({ onPerformSearch }) {
  const {
    stations,
    searchParams,
    setSearchParams,
    swapSearchStations,
    executeSearch,
    isSearching
  } = useCustomerData();

  const handleFromChange = (e) => {
    setSearchParams(prev => ({ ...prev, fromStationId: e.target.value }));
  };

  const handleToChange = (e) => {
    setSearchParams(prev => ({ ...prev, toStationId: e.target.value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchParams.fromStationId && searchParams.toStationId) {
      executeSearch(searchParams.fromStationId, searchParams.toStationId);
      if (onPerformSearch) onPerformSearch();
    }
  };

  const setPresetJourney = (fromId, toId) => {
    setSearchParams(prev => ({ ...prev, fromStationId: fromId, toStationId: toId }));
    executeSearch(fromId, toId);
    if (onPerformSearch) onPerformSearch();
  };

  return (
    <div className="journey-search-hero-section">
      {/* Hero Title & Subtitle */}
      <div className="hero-text-block">
        <div className="passenger-badge font-mono">
          <span className="badge-dot" />
          <span>PASSENGER JOURNEY PORTAL</span>
        </div>
        <h1 className="hero-main-title">
          Know when your train will <span className="title-gradient">actually arrive</span>.
        </h1>
        <p className="hero-sub-title">
          Live railway information with continuously updated predicted arrival times.
        </p>
      </div>

      {/* Large Journey Search Card */}
      <form className="journey-search-card" onSubmit={handleSearchSubmit}>
        <div className="search-inputs-grid">
          
          {/* FROM Station */}
          <div className="search-field-group">
            <label htmlFor="from-station" className="search-label font-mono">
              <span className="label-icon">📍</span> FROM STATION
            </label>
            <div className="select-wrapper">
              <select
                id="from-station"
                className="search-select font-bold"
                value={searchParams.fromStationId}
                onChange={handleFromChange}
              >
                {stations.map(st => (
                  <option key={st.id} value={st.id} disabled={st.id === searchParams.toStationId}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="swap-button-wrap">
            <button
              type="button"
              className="swap-btn"
              onClick={swapSearchStations}
              title="Swap From and To stations"
              aria-label="Swap origin and destination"
            >
              ⇄
            </button>
          </div>

          {/* TO Station */}
          <div className="search-field-group">
            <label htmlFor="to-station" className="search-label font-mono">
              <span className="label-icon">🏁</span> TO STATION
            </label>
            <div className="select-wrapper">
              <select
                id="to-station"
                className="search-select font-bold"
                value={searchParams.toStationId}
                onChange={handleToChange}
              >
                {stations.map(st => (
                  <option key={st.id} value={st.id} disabled={st.id === searchParams.fromStationId}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Selector */}
          <div className="search-field-group date-field">
            <label htmlFor="journey-date" className="search-label font-mono">
              <span className="label-icon">📅</span> DATE
            </label>
            <input
              id="journey-date"
              type="text"
              className="search-input font-bold"
              value="Today"
              readOnly
            />
          </div>

          {/* Submit Search Button */}
          <div className="search-action-wrap">
            <button
              type="submit"
              className="btn-search-trains font-mono"
              disabled={isSearching || searchParams.fromStationId === searchParams.toStationId}
            >
              {isSearching ? (
                <span>SEARCHING...</span>
              ) : (
                <>
                  <span>SEARCH TRAINS</span>
                  <span className="btn-arrow">➔</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Quick Route Preset Chips */}
        <div className="search-quick-presets font-mono">
          <span className="preset-label">POPULAR CORRIDORS:</span>
          <button type="button" className="preset-chip" onClick={() => setPresetJourney('STATION_B', 'STATION_E')}>
            Station B ➔ Station E
          </button>
          <button type="button" className="preset-chip" onClick={() => setPresetJourney('STATION_A', 'STATION_J')}>
            Station A ➔ Station J
          </button>
          <button type="button" className="preset-chip" onClick={() => setPresetJourney('STATION_C', 'STATION_F')}>
            Station C ➔ Station F
          </button>
          <button type="button" className="preset-chip" onClick={() => setPresetJourney('STATION_D', 'STATION_H')}>
            Station D ➔ Station H
          </button>
        </div>
      </form>

      {/* Reassurance Feature Bar */}
      <div className="search-feature-tagline font-mono">
        <span>● Live data</span>
        <span className="tagline-dot">•</span>
        <span>⚡ Continuously updated ETAs</span>
        <span className="tagline-dot">•</span>
        <span>🧠 Smarter journey planning</span>
      </div>
    </div>
  );
}
