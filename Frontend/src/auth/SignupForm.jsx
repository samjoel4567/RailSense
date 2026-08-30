/**
 * RAIL//AI — Operator Registration (Sign Up) Form
 * 
 * Clean two-state industrial registration component.
 * Supports full name, email, password, confirm password, role selector,
 * terms acceptance, inline validation, and smooth transition back to Login.
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const ROLE_OPTIONS = [
  {
    id: 'LOCO_PILOT',
    name: 'Loco Pilot',
    code: 'LP-CAB',
    desc: 'In-cab signaling, DMI telemetry, and speed restriction monitoring'
  },
  {
    id: 'STATION_MASTER',
    name: 'Station Master',
    code: 'SM-STN',
    desc: 'Platform assignment, dwell scheduling, and station route interlocking'
  },
  {
    id: 'CONTROL_ROOM',
    name: 'Control Room',
    code: 'CR-NET',
    desc: 'Network-wide dispatching, AI conflict resolution, and intrusion handling'
  },
  {
    id: 'ADMIN',
    name: 'Administrator',
    code: 'SYS-SIL4',
    desc: 'Full administrative access across all 10 stations and 30 trains'
  }
];

export default function SignupForm({ onSwitchToLogin, onSuccess }) {
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CONTROL_ROOM',
    termsAccepted: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Validate form fields
  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid railway or enterprise email';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Confirmation password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      errs.role = 'Please select your operator role';
    }

    if (!formData.termsAccepted) {
      errs.termsAccepted = 'You must acknowledge the SIL-4 operating safety protocol';
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
    // Clear field error on change
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
      const res = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (onSuccess) {
        onSuccess(res.user);
      }
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card-inner">
      <div className="auth-card-header">
        <div className="auth-header-tag font-mono">OPERATOR ENROLLMENT</div>
        <h2 className="auth-card-title">Create Account</h2>
        <p className="auth-card-subtitle">
          Register new credentials for the RAIL//AI railway operational network.
        </p>
      </div>

      {/* Server Error Banner */}
      {serverError && (
        <div className="auth-alert auth-alert-error font-mono">
          <span className="alert-icon">⚠</span>
          <span>{serverError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label font-mono" htmlFor="signup-name">
            FULL NAME <span className="req">*</span>
          </label>
          <div className={`input-wrapper ${errors.name ? 'has-error' : ''}`}>
            <input
              id="signup-name"
              name="name"
              type="text"
              autoComplete="name"
              className="form-input font-mono"
              placeholder="e.g. Capt. Samuel Joel"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span className="input-icon">👤</span>
          </div>
          {errors.name && <span className="field-error font-mono">{errors.name}</span>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label font-mono" htmlFor="signup-email">
            OPERATOR EMAIL <span className="req">*</span>
          </label>
          <div className={`input-wrapper ${errors.email ? 'has-error' : ''}`}>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-input font-mono"
              placeholder="e.g. s.joel@railway.ai"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span className="input-icon">✉</span>
          </div>
          {errors.email && <span className="field-error font-mono">{errors.email}</span>}
        </div>

        {/* Password and Confirm Password Row */}
        <div className="form-row-2col">
          {/* Password */}
          <div className="form-group">
            <label className="form-label font-mono" htmlFor="signup-password">
              PASSWORD (MIN 8) <span className="req">*</span>
            </label>
            <div className={`input-wrapper ${errors.password ? 'has-error' : ''}`}>
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label font-mono" htmlFor="signup-confirm-password">
              CONFIRM PASSWORD <span className="req">*</span>
            </label>
            <div className={`input-wrapper ${errors.confirmPassword ? 'has-error' : ''}`}>
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="form-input font-mono"
                placeholder="••••••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? '👁' : '👁‍🗨'}
              </button>
            </div>
            {errors.confirmPassword && <span className="field-error font-mono">{errors.confirmPassword}</span>}
          </div>
        </div>

        {/* Role Selector */}
        <div className="form-group">
          <label className="form-label font-mono">
            ASSIGNED OPERATING ROLE <span className="req">*</span>
          </label>
          <div className="role-selector-grid">
            {ROLE_OPTIONS.map(role => {
              const isSelected = formData.role === role.id;
              return (
                <label
                  key={role.id}
                  className={`role-option-card ${isSelected ? 'is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.id}
                    checked={isSelected}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <div className="role-card-content">
                    <div className="role-card-top">
                      <span className="role-name">{role.name}</span>
                      <span className="role-code font-mono">{role.code}</span>
                    </div>
                    <p className="role-desc">{role.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.role && <span className="field-error font-mono">{errors.role}</span>}
        </div>

        {/* Terms & Conditions */}
        <div className="form-group">
          <label className={`checkbox-label font-mono ${errors.termsAccepted ? 'has-error' : ''}`}>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span style={{ fontSize: 11, lineHeight: 1.4 }}>
              I agree to the <strong>RAIL//AI SIL-4 Safety Protocol</strong> and understand that simulated dispatch commands are audited.
            </span>
          </label>
          {errors.termsAccepted && <span className="field-error font-mono">{errors.termsAccepted}</span>}
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
              <span>CREATING OPERATOR PROFILE...</span>
            </>
          ) : (
            <>
              <span>CREATE ACCOUNT</span>
              <span className="btn-arrow">➔</span>
            </>
          )}
        </button>

        {/* Switch to Login */}
        <div className="auth-switch-prompt font-mono">
          <span>Already registered?</span>{' '}
          <button
            type="button"
            className="auth-switch-link"
            onClick={onSwitchToLogin}
          >
            SIGN IN TO TERMINAL
          </button>
        </div>
      </form>
    </div>
  );
}
