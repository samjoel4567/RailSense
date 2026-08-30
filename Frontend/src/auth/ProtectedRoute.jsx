/**
 * RAIL//AI — Protected Route Component
 * 
 * Enforces authentication and role-based access control.
 * Unauthenticated users are redirected to the /auth portal.
 * Users with insufficient role clearance see an operational restriction banner.
 */

import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ROLE_LABELS, normalizeRole } from './authService';

export default function ProtectedRoute({
  children,
  requiredRoles = null,
  onNavigate = null,
  pageName = 'Operational Console'
}) {
  const { user, isAuthenticated, loading, hasRole } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (onNavigate) {
        onNavigate('auth');
      } else {
        window.location.hash = '#auth';
      }
    }
  }, [loading, isAuthenticated, onNavigate]);

  // 1. Initial session checking state
  if (loading) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: 'var(--font-mono, monospace)',
        background: 'var(--bg-primary, #fcfcfd)'
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(15, 23, 42, 0.1)',
          borderTopColor: 'var(--accent-action, #0f172a)',
          borderRadius: '50%',
          animation: 'auth-spin 0.8s linear infinite'
        }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-secondary, #475569)' }}>
          VERIFYING OPERATOR CREDENTIALS...
        </div>
        <style>{`
          @keyframes auth-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Unauthenticated state — redirecting
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        fontFamily: 'var(--font-mono, monospace)'
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-rail-red, #e11d48)', letterSpacing: '0.1em' }}>
          ● AUTHENTICATION REQUIRED
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>
          Redirecting to operator authentication terminal...
        </p>
        <button
          className="btn-primary"
          onClick={() => onNavigate ? onNavigate('auth') : (window.location.hash = '#auth')}
          style={{ padding: '8px 16px', fontSize: 11 }}
        >
          GO TO LOGIN TERMINAL
        </button>
      </div>
    );
  }

  // 3. Role-Based Access Control
  if (requiredRoles && !hasRole(requiredRoles)) {
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const allowedLabels = rolesArray.map(r => ROLE_LABELS[normalizeRole(r)] || r).join(' or ');
    const userRoleLabel = ROLE_LABELS[normalizeRole(user?.role)] || user?.role || 'OPERATOR';

    return (
      <div style={{
        maxWidth: 720,
        margin: '60px auto',
        padding: '36px 32px',
        background: '#ffffff',
        border: '1px solid #fecdd3',
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(225, 29, 72, 0.06)',
        fontFamily: 'var(--font-body, sans-serif)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff1f2',
          border: '1px solid #fda4af',
          padding: '4px 12px',
          borderRadius: 4,
          marginBottom: 16
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e11d48' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#be123c', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em' }}>
            SECURITY ACCESS RESTRICTION · SIL-4 ENFORCEMENT
          </span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Access Clearance Required
        </h2>

        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
          Your current operator credentials (<strong style={{ color: '#0f172a' }}>{userRoleLabel}</strong>) do not hold authorization for the <strong style={{ color: '#0f172a' }}>{pageName}</strong> console. This terminal requires <strong style={{ color: '#be123c' }}>{allowedLabels}</strong> clearance.
        </p>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '14px 16px',
          marginBottom: 24,
          fontSize: 12,
          fontFamily: 'var(--font-mono, monospace)',
          color: '#334155'
        }}>
          <div>OPERATOR: {user?.name || 'Unknown'} ({user?.email})</div>
          <div>ASSIGNED ROLE: {userRoleLabel}</div>
          <div>REQUIRED CLEARANCE: {allowedLabels}</div>
          <div>TIMESTAMP: {new Date().toLocaleTimeString()}</div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => onNavigate ? onNavigate('simulator') : (window.location.hash = '#simulator')}
            style={{ fontSize: 12, padding: '9px 18px' }}
          >
            RETURN TO SIMULATOR CONSOLE
          </button>
          <button
            onClick={() => onNavigate ? onNavigate('home') : (window.location.hash = '#home')}
            style={{
              padding: '9px 18px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            MAIN OVERVIEW
          </button>
        </div>
      </div>
    );
  }

  // 4. Authorized — render page content
  return children;
}
