/**
 * RAIL//AI Simulation Clock
 * Provides deterministic simulation time management and playback ticks.
 */

export class SimulationClock {
  constructor(initialTimeStr = '14:20:00') {
    this.initialTimeStr = initialTimeStr;
    this.initialSeconds = this.parseTimeToSeconds(initialTimeStr);
    this.currentSeconds = this.initialSeconds;
    this.isRunning = false;
    this.speedMultiplier = 1; // 1x simulation speed
    this.autoPlay = true;
    this.subscribers = new Set();
  }

  parseTimeToSeconds(timeStr) {
    const [hh, mm, ss] = timeStr.split(':').map(Number);
    return (hh * 3600) + (mm * 60) + (ss || 0);
  }

  formatSecondsToTime(totalSeconds) {
    const s = Math.floor(totalSeconds) % 86400;
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  getTimeString() {
    return this.formatSecondsToTime(this.currentSeconds);
  }

  getElapsedSeconds() {
    return this.currentSeconds - this.initialSeconds;
  }

  setTime(timeStr) {
    this.currentSeconds = this.parseTimeToSeconds(timeStr);
  }

  setElapsedSeconds(elapsedSec) {
    this.currentSeconds = this.initialSeconds + elapsedSec;
  }

  reset() {
    this.currentSeconds = this.initialSeconds;
    this.isRunning = false;
  }

  tick(deltaMs = 100) {
    if (!this.isRunning) return 0;
    const addedSeconds = (deltaMs / 1000) * this.speedMultiplier;
    this.currentSeconds += addedSeconds;
    return addedSeconds;
  }
}
