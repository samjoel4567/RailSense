/**
 * RAIL//AI — Operator Login Form
 * 
 * Clean two-state industrial authentication card component.
 * Supports email/password, show/hide toggle, remember me, inline validation,
 * and quick-fill operator demo credentials.
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function LoginForm({ onSwitchToSignup, onSuccess }) {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [forgotNotice, setForgotNotice] = useState(false);

  // Validate form fields
  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid railway or organization email';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear inline error on edit
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });

      if (onSuccess) {
        onSuccess(res.user);
      }
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick-fill helper for instant operator testing
  const handleQuickFill = (roleEmail, defaultPass = 'Railway@2026') => {
    setFormData({
      email: roleEmail,
      password: defaultPass,
      rememberMe: true
    });
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="auth-card-inner">
      <div className="auth-card-header">
        <div className="auth-header-tag font-mono">OPERATIONAL TERMINAL ACCESS</div>
        <h2 className="auth-card-title">Operator Sign In</h2>
        <p className="auth-card-subtitle">
          Authenticate to access interlocking, dispatch telemetry, and simulator controls.
        </p>
      </div>

      {/* Server / Auth Error Banner */}
      {serverError && (
        <div className="auth-alert auth-alert-error font-mono">
          <span className="alert-icon">⚠</span>
          <span>{serverError}</span>
        </div>
      )}

      {/* Forgot Password Notice */}
      {forgotNotice && (
        <div className="auth-alert auth-alert-info font-mono">
          <span className="alert-icon">ℹ</span>
          <span>Password recovery link dispatched to designated supervisor for validation.</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="form-group">
          <label className="form-label font-mono" htmlFor="login-email">
            OPERATOR EMAIL <span className="req">*</span>
          </label>
          <div className={`input-wrapper ${errors.email ? 'has-error' : ''}`}>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-input font-mono"
              placeholder="e.g. pilot.raj@railway.ai"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span className="input-icon">✉</span>
          </div>
          {errors.email && <span className="field-error font-mono">{errors.email}</span>}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label font-mono" htmlFor="login-password">
              SECURITY KEY / PASSWORD <span className="req">*</span>
            </label>
            <button
              type="button"
              className="forgot-link font-mono"
              onClick={() => setForgotNotice(true)}
            >
              Forgot password?
            </button>
          </div>
          <div className={`input-wrapper ${errors.password ? 'has-error' : ''}`}>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="form-input font-mono"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="pwd-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁' : '👁‍🗨'}
            </button>
          </div>
          {errors.password && <span className="field-error font-mono">{errors.password}</span>}
        </div>

        {/* Remember Me */}
        <div className="form-row-checkbox">
          <label className="checkbox-label font-mono">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span>Remember this console</span>
          </label>
          <span className="sil-badge font-mono">SIL-4 SECURE</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-submit-btn btn-primary font-mono"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="btn-spinner" />
              <span>AUTHENTICATING OPERATOR...</span>
            </>
          ) : (
            <>
              <span>SIGN IN TO TERMINAL</span>
              <span className="btn-arrow">➔</span>
            </>
          )}
        </button>

        {/* Switch to Signup */}
        <div className="auth-switch-prompt font-mono">
          <span>New operator?</span>{' '}
          <button
            type="button"
            className="auth-switch-link"
            onClick={onSwitchToSignup}
          >
            CREATE AN ACCOUNT
          </button>
        </div>
      </form>

      {/* Quick Access Preset Roles (Useful for presentations & evaluations) */}
      <div className="auth-quick-preset">
        <div className="preset-title font-mono">QUICK OPERATOR PRESETS:</div>
        <div className="preset-pills">
          <button
            type="button"
            className="preset-pill font-mono"
            onClick={() => handleQuickFill('pilot.chen@railway.ai')}
            title="Loco Pilot (Speed & Signal focus)"
          >
            ● Loco Pilot
          </button>
          <button
            type="button"
            className="preset-pill font-mono"
            onClick={() => handleQuickFill('station.master@railway.ai')}
            title="Station Master (Platform interlocking)"
          >
            ● Station Master
          </button>
          <button
            type="button"
            className="preset-pill font-mono"
            onClick={() => handleQuickFill('control.room@railway.ai')}
            title="Control Room (Network Dispatcher)"
          >
            ● Control Room
          </button>
          <button
            type="button"
            className="preset-pill font-mono"
            onClick={() => handleQuickFill('admin@railway.ai')}
            title="Full Administrator"
          >
            ● Admin
          </button>
        </div>
      </div>
    </div>
  );
}
