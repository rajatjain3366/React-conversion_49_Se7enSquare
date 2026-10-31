import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../Components/Button';
import Icon from '../Components/Icon';
import useAuthForm from '../Components/platform/hooks/useAuthForm';
import '../styles/login.css';

/**
 * Login & Authentication Component
 * Converted from login.html, preserving all styles, animations, and personas.
 * Architecture: Clean UI/presentation layer backed by useAuthForm() hook and authService.
 */
export default function Login() {
  const {
    currentTab,
    setCurrentTab,
    cardShake,
    toast,
    // Login
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginRole,
    setLoginRole,
    rememberMe,
    setRememberMe,
    showLoginPassword,
    setShowLoginPassword,
    loginLoading,
    loginErrors,
    setLoginErrors,
    handleLoginSubmit,
    personas,
    handleQuickLogin,
    // Register
    regFullName,
    setRegFullName,
    regEmail,
    setRegEmail,
    regHandle,
    setRegHandle,
    regPassword,
    setRegPassword,
    regConfirm,
    setRegConfirm,
    regRole,
    setRegRole,
    regTerms,
    setRegTerms,
    showRegPassword,
    setShowRegPassword,
    showRegConfirm,
    setShowRegConfirm,
    regLoading,
    regErrors,
    setRegErrors,
    strength,
    handleRegisterSubmit,
    // Forgot password
    forgotEmail,
    setForgotEmail,
    forgotError,
    setForgotError,
    forgotLoading,
    handleForgotSubmit,
    // Google Sign-In
    googleLoading,
    handleGoogleSignIn,
  } = useAuthForm();

  return (
    <div className="login-page-container ui-v2" style={{ minHeight: '100vh', width: '100%', position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
      {/* Back to Home Link */}
      <Link
        to="/landing"
        style={{
          position: 'absolute',
          top: '32px',
          left: '40px',
          color: 'var(--text-muted, #888)',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: "'Syne', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 50,
          transition: 'color 0.2s ease',
        }}
        title="Return to Landing Page"
      >
        <span style={{ fontSize: '18px' }}>←</span> Back to Home
      </Link>

      {/* Ambient Glow */}
      <div className="ambient-glow"></div>

      {/* Main Login Wrapper */}
      <div className="login-wrapper">
        <div className={`login-card ${cardShake ? 'shake' : ''}`} id="loginCard">
          {/* Logo */}
          <div className="login-logo">
            <div className="logo-hex">G</div>
            <span className="logo-text">Gameunity</span>
          </div>

          {/* Subtitle */}
          {currentTab === 'login' && (
            <p className="login-subtitle">Welcome back! Sign in to your account.</p>
          )}
          {currentTab === 'register' && (
            <p className="login-subtitle">Create a free account to get started.</p>
          )}

          {/* Tab Switcher (Visible on login / register tabs) */}
          {(currentTab === 'login' || currentTab === 'register') && (
            <div className="auth-tabs" id="authTabs">
              <button
                type="button"
                className={`auth-tab ${currentTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab('login');
                  setLoginErrors({});
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-tab ${currentTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab('register');
                  setRegErrors({});
                }}
              >
                Register
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════
             LOGIN FORM
          ═══════════════════════════════════════ */}
          {currentTab === 'login' && (
            <form className="auth-form" onSubmit={handleLoginSubmit} noValidate>
              {loginErrors.general && (
                <div className="auth-alert error" style={{
                  background: 'rgba(248, 81, 73, 0.12)',
                  border: '1px solid rgba(248, 81, 73, 0.35)',
                  color: '#F85149',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="alert-circle" size={16} />
                    <span>{loginErrors.general}</span>
                  </div>
                  {(loginErrors.isSanctioned || (typeof window !== 'undefined' && window.location.search.includes('accountStatus'))) && (
                    <Link
                      to="/appeal"
                      style={{
                        color: '#58A6FF',
                        textDecoration: 'underline',
                        fontSize: '12px',
                        marginLeft: '24px',
                        fontWeight: 600,
                      }}
                    >
                      Submit an Appeal →
                    </Link>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email or Username
                </label>
                <input
                  className={`form-input ${loginErrors.email ? 'error' : ''}`}
                  type="text"
                  id="login-email"
                  placeholder="Enter your email or username"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginErrors.email) setLoginErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  autoComplete="username"
                  required
                />
                {loginErrors.email && (
                  <span className="form-error visible">{loginErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <div className="input-password-wrap">
                  <input
                    className={`form-input ${loginErrors.password ? 'error' : ''}`}
                    type={showLoginPassword ? 'text' : 'password'}
                    id="login-password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <Icon name="eye" size={16} /> : <Icon name="eye-off" size={16} />}
                  </button>
                </div>
                {loginErrors.password && (
                  <span className="form-error visible">{loginErrors.password}</span>
                )}
              </div>

              <div className="form-row">
                <label className="checkbox-wrap">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-label">Remember me</span>
                </label>
                <a
                  href="#forgot"
                  className="forgot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentTab('forgot');
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Role Selector */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-role">
                  Sign in as
                </label>
                <select
                  className={`form-input form-select ${loginErrors.role ? 'error' : ''}`}
                  id="login-role"
                  value={loginRole}
                  onChange={(e) => {
                    setLoginRole(e.target.value);
                    if (loginErrors.role) setLoginErrors((prev) => ({ ...prev, role: '' }));
                  }}
                >
                  <option value="">Auto-detect from Account</option>
                  <option value="admin">System Admin</option>
                  <option value="owner">Platform Owner</option>
                  <option value="community_manager">Community Manager</option>
                  <option value="organizer">Organizer</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>
                {loginErrors.role && (
                  <span className="form-error visible">{loginErrors.role}</span>
                )}
              </div>

              <Button
                type="submit"
                className={`btn-submit ${loginLoading ? 'loading' : ''}`}
                id="login-btn"
                disabled={loginLoading}
              >
                <span className="btn-text">Sign in</span>
                {loginLoading && <span className="btn-spinner"></span>}
              </Button>

              {/* Quick Persona Access */}
              <div className="demo-personas">
                <span className="demo-label">Quick access:</span>
                {personas.map((p) => (
                  <button
                    key={p.username}
                    type="button"
                    className="demo-pill"
                    onClick={() => handleQuickLogin(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <button
                type="button"
                className="btn-google"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                aria-label="Continue with Google"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.252-.164-1.842H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.614z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.462.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════
             REGISTER FORM
          ═══════════════════════════════════════ */}
          {currentTab === 'register' && (
            <form className="auth-form" onSubmit={handleRegisterSubmit} noValidate>
              {regErrors.general && (
                <div className="auth-alert error" style={{
                  background: 'rgba(248, 81, 73, 0.12)',
                  border: '1px solid rgba(248, 81, 73, 0.35)',
                  color: '#F85149',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Icon name="alert-circle" size={16} />
                  <span>{regErrors.general}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="reg-fullname">
                  Full Name
                </label>
                <input
                  className={`form-input ${regErrors.fullName ? 'error' : ''}`}
                  type="text"
                  id="reg-fullname"
                  placeholder="Enter your full name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
                {regErrors.fullName && (
                  <span className="form-error visible">{regErrors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  Email
                </label>
                <input
                  className={`form-input ${regErrors.email ? 'error' : ''}`}
                  type="email"
                  id="reg-email"
                  placeholder="Enter your email address"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
                {regErrors.email && (
                  <span className="form-error visible">{regErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-handle">
                  Username / Handle
                </label>
                <input
                  className={`form-input ${regErrors.handle ? 'error' : ''}`}
                  type="text"
                  id="reg-handle"
                  placeholder="Choose a unique handle"
                  value={regHandle}
                  onChange={(e) => setRegHandle(e.target.value)}
                  required
                />
                {regErrors.handle && (
                  <span className="form-error visible">{regErrors.handle}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  Password
                </label>
                <div className="input-password-wrap">
                  <input
                    className={`form-input ${regErrors.password ? 'error' : ''}`}
                    type={showRegPassword ? 'text' : 'password'}
                    id="reg-password"
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showRegPassword ? <Icon name="eye" size={16} /> : <Icon name="eye-off" size={16} />}
                  </button>
                </div>
                {regErrors.password && (
                  <span className="form-error visible">{regErrors.password}</span>
                )}

                {/* Password Strength Indicator */}
                {regPassword && (
                  <div className="password-strength" id="password-strength">
                    <div className="strength-bar">
                      <div className={`strength-fill ${strength.level}`}></div>
                    </div>
                    <span className="strength-text">{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm">
                  Confirm Password
                </label>
                <div className="input-password-wrap">
                  <input
                    className={`form-input ${regErrors.confirm ? 'error' : ''}`}
                    type={showRegConfirm ? 'text' : 'password'}
                    id="reg-confirm"
                    placeholder="Confirm your password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegConfirm((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showRegConfirm ? <Icon name="eye" size={16} /> : <Icon name="eye-off" size={16} />}
                  </button>
                </div>
                {regErrors.confirm && (
                  <span className="form-error visible">{regErrors.confirm}</span>
                )}
              </div>

              {/* Account Type */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-role">
                  Account Type
                </label>
                <select
                  className="form-input form-select"
                  id="reg-role"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  required
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="organizer">Organizer</option>
                </select>
              </div>

              <label className="checkbox-wrap terms-check">
                <input
                  type="checkbox"
                  id="reg-terms"
                  checked={regTerms}
                  onChange={(e) => setRegTerms(e.target.checked)}
                  required
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">
                  I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
                </span>
              </label>
              {regErrors.terms && (
                <span className="form-error visible" style={{ marginBottom: '12px', display: 'block' }}>
                  {regErrors.terms}
                </span>
              )}

              <Button
                type="submit"
                className={`btn-submit ${regLoading ? 'loading' : ''}`}
                id="register-btn"
                disabled={regLoading}
              >
                <span className="btn-text">Create Account</span>
                {regLoading && <span className="btn-spinner"></span>}
              </Button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn-google"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                aria-label="Continue with Google"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.252-.164-1.842H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.614z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.462.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{googleLoading ? 'Signing up with Google...' : 'Continue with Google'}</span>
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════
             FORGOT PASSWORD FORM
          ═══════════════════════════════════════ */}
          {currentTab === 'forgot' && (
            <form className="auth-form" onSubmit={handleForgotSubmit} noValidate>
              <div className="forgot-icon-wrap">
                <div className="forgot-icon"><Icon name="lock" size={22} /></div>
              </div>
              <h2 className="forgot-title">Forgot Password</h2>
              <p className="forgot-desc">Enter your email address and we'll send you a link to reset your password.</p>

              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">
                  Email Address
                </label>
                <input
                  className={`form-input ${forgotError ? 'error' : ''}`}
                  type="email"
                  id="forgot-email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (forgotError) setForgotError('');
                  }}
                  required
                />
                {forgotError && <span className="form-error visible">{forgotError}</span>}
              </div>

              <Button
                type="submit"
                className={`btn-submit ${forgotLoading ? 'loading' : ''}`}
                id="forgot-btn"
                disabled={forgotLoading}
              >
                <span className="btn-text">Send Reset Link</span>
                {forgotLoading && <span className="btn-spinner"></span>}
              </Button>

              <a
                href="#back-to-login"
                className="back-to-login"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab('login');
                }}
              >
                ← Back to login
              </a>
            </form>
          )}

          {/* ═══════════════════════════════════════
             FORGOT PASSWORD SUCCESS STATE
          ═══════════════════════════════════════ */}
          {currentTab === 'forgot-success' && (
            <div className="auth-form" id="form-forgot-success">
              <div className="success-icon-wrap">
                <div className="success-icon"><Icon name="mail" size={22} /></div>
              </div>
              <h2 className="forgot-title">Check Your Email</h2>
              <p className="forgot-desc">
                We've sent a password reset link to <strong>{forgotEmail}</strong>. Please check your inbox and follow
                the instructions.
              </p>
              <a
                href="#back-to-login"
                className="back-to-login"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab('login');
                }}
              >
                ← Back to login
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`toast ${toast.show ? 'show' : ''}`} id="toast">
        <span id="toastIcon">{toast.icon}</span>
        <span id="toastMsg">{toast.msg}</span>
      </div>
    </div>
  );
}

