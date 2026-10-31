import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { initiateGoogleSignIn } from '../../../services/googleAuth';
import { getHomeRoute } from '../../../services/roleAccess';

export const PERSONAS = [
  { name: 'ADMIN (admin01)', username: 'admin01', role: 'admin', icon: '🛡️', pass: 'Demo@123' },
  { name: 'MOD (mod01)', username: 'mod01', role: 'moderator', icon: '🔍', pass: 'Demo@123' },
  { name: 'CM (cm01)', username: 'cm01', role: 'community_manager', icon: '📅', pass: 'Demo@123' },
  { name: 'ORGANIZER (org01)', username: 'org01', role: 'organizer', icon: '🏆', pass: 'Demo@123' },
  { name: 'PLAYER (player01)', username: 'player01', role: 'user', icon: '🎮', pass: 'Demo@123' },
  { name: 'OWNER (sanidhya)', username: 'sanidhya', role: 'owner', icon: '👑', pass: 'Demo@123' },
];

/**
 * Custom hook managing authentication, validation, state, and submissions for the Login/Register page.
 */
export default function useAuthForm() {
  const navigate = useNavigate();

  // ── 1. Tab & View State ──
  // Tabs: 'login' | 'register' | 'forgot' | 'forgot-success'
  const [currentTab, setCurrentTab] = useState('login');
  const [cardShake, setCardShake] = useState(false);

  // ── 2. Toast State ──
  const [toast, setToast] = useState({ show: false, icon: '✅', msg: '' });

  const showToast = (icon, msg) => {
    setToast({ show: true, icon, msg });
    setTimeout(() => {
      setToast({ show: false, icon: '✅', msg: '' });
    }, 3500);
  };

  const triggerShake = () => {
    setCardShake(true);
    setTimeout(() => setCardShake(false), 450);
  };

  // ── 3. Login Form State & Validation ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const accountStatus = params.get('accountStatus');
      const reason = params.get('reason');
      if (accountStatus) {
        const msg =
          reason ||
          (accountStatus === 'ACCOUNT_BANNED'
            ? 'This account has been banned.'
            : 'This account has been suspended.');
        setLoginErrors((prev) => ({ ...prev, general: msg, isSanctioned: true }));
        showToast('⚠️', msg);
      }
      // Set by handleRoleMismatch() in services/api.js after an admin changed
      // this user's role: explain why they were logged out.
      if (params.get('roleChanged')) {
        const msg = 'Your role was changed by an admin. Please log in again.';
        setLoginErrors((prev) => ({ ...prev, general: msg }));
        showToast('ℹ️', msg);
      }
    }
  }, []);

  const validateLogin = () => {
    const errors = {};
    const trimmedInput = loginEmail.trim();

    if (!trimmedInput) {
      errors.email = 'Email or username is required.';
    }

    if (!loginPassword) {
      errors.password = 'Password is required.';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const navigateByRole = (userRole) => {
    navigate(getHomeRoute(userRole));
  };


  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateLogin()) {
      triggerShake();
      showToast('⚠️', 'Please enter your username/email and password.');
      return;
    }

    setLoginLoading(true);
    setLoginErrors((prev) => ({ ...prev, general: '' }));

    try {
      const user = await authService.login({
        login: loginEmail,
        password: loginPassword,
        role: loginRole,
      });

      authService.saveSession(user);

      showToast(
        '✅',
        `Signed in successfully as ${user.username} (${(user.role || loginRole || 'user').toUpperCase()})!`
      );

      setTimeout(() => {
        setLoginLoading(false);
        navigateByRole(user.role);
      }, 700);
    } catch (err) {
      console.error('Login request failed:', err);
      triggerShake();
      const failMsg = err.reason || err.message || 'Cannot reach authentication server';
      const isSanctioned =
        err.code === 'ACCOUNT_BANNED' ||
        err.code === 'ACCOUNT_SUSPENDED' ||
        err.status === 403;
      setLoginErrors((prev) => ({
        ...prev,
        general: failMsg,
        isSanctioned: isSanctioned || prev.isSanctioned,
      }));
      showToast('❌', failMsg);
      setLoginLoading(false);
    }
  };

  const handleQuickLogin = (p) => {
    setCurrentTab('login');
    setLoginEmail(p.username);
    setLoginPassword(p.pass);
    setLoginRole(p.role);
    setLoginErrors({});
    showToast('⚡', `Loaded credentials for ${p.name}`);
  };

  // ── 4. Register Form State & Validation ──
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState('user');
  const [regTerms, setRegTerms] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  const getPasswordStrength = (pass) => {
    if (!pass) return { level: '', label: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*]/.test(pass)) score++;

    const levels = ['', 'weak', 'fair', 'good', 'strong'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { level: levels[score] || 'weak', label: labels[score] || 'Weak' };
  };

  const strength = getPasswordStrength(regPassword);

  const validateRegister = () => {
    const errors = {};
    if (!regFullName.trim()) errors.fullName = 'Full Name is required.';
    if (!regEmail.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!regHandle.trim()) {
      errors.handle = 'Username is required.';
    } else if (regHandle.trim().length < 3) {
      errors.handle = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(regHandle.trim())) {
      errors.handle = 'Username can only contain letters, numbers, and underscores.';
    }

    if (!regPassword) {
      errors.password = 'Password is required.';
    } else if (regPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!regConfirm) {
      errors.confirm = 'Please confirm your password.';
    } else if (regPassword !== regConfirm) {
      errors.confirm = 'Passwords do not match.';
    }

    if (!regTerms) {
      errors.terms = 'You must agree to the Terms of Service and Privacy Policy.';
    }

    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateRegister()) {
      triggerShake();
      showToast('⚠️', 'Please complete all required registration fields.');
      return;
    }

    setRegLoading(true);
    setRegErrors((prev) => ({ ...prev, general: '' }));

    try {
      const nameParts = regFullName.trim().split(/\s+/);
      const firstName = nameParts[0] || regFullName.trim();
      const lastName = nameParts.slice(1).join(' ') || undefined;

      const createdUser = await authService.register({
        username: regHandle,
        email: regEmail,
        password: regPassword,
        role: regRole,
        firstName,
        lastName,
      });

      setRegLoading(false);
      showToast('🎉', `Account @${createdUser.username} created successfully! Please sign in.`);
      setTimeout(() => {
        setCurrentTab('login');
        setLoginEmail(createdUser.username);
        setLoginPassword(regPassword);
        setLoginRole(createdUser.role || regRole);
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      triggerShake();
      const failMsg = err.message || 'Unable to connect to registration server';
      setRegErrors((prev) => ({ ...prev, general: failMsg }));
      showToast('❌', failMsg);
      setRegLoading(false);
    }
  };

  // ── 5. Forgot Password State ──
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address.');
      triggerShake();
      return;
    }

    setForgotError('');
    setForgotLoading(true);

    setTimeout(() => {
      setForgotLoading(false);
      setCurrentTab('forgot-success');
      showToast('✉️', 'Password reset instructions sent!');
    }, 1200);
  };

  // ── 6. Google Sign-In State & Handler ──
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    try {
      const result = await initiateGoogleSignIn(clientId);

      if (result.error) {
        if (
          result.error === 'ACCESS_DENIED' ||
          result.error === 'POPUP_FAILED' ||
          result.error === 'POPUP_CLOSED'
        ) {
          showToast('ℹ️', result.message || 'Google sign-in was cancelled.');
        } else if (result.error === 'MISSING_CLIENT_ID') {
          showToast('⚠️', result.message);
        } else {
          showToast('❌', result.message || 'Google sign-in failed.');
        }
        setGoogleLoading(false);
        return;
      }

      if (result.accessToken || result.credential) {
        showToast('🔄', 'Signing in with Google...');
        const user = await authService.loginWithGoogle({
          accessToken: result.accessToken,
          credential: result.credential,
        });

        showToast(
          '🎉',
          `Welcome, ${user.firstName || user.username} (${(user.role || 'user').toUpperCase()})!`
        );

        setTimeout(() => {
          navigateByRole(user.role);
        }, 700);
      }
    } catch (err) {
      console.error('Google login error:', err);
      triggerShake();
      const failMsg = err.message || 'Google authentication failed';
      showToast('❌', failMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return {
    navigate,
    currentTab,
    setCurrentTab,
    cardShake,
    toast,
    showToast,
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
    personas: PERSONAS,
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
    forgotLoading,
    handleForgotSubmit,
    // Google Sign-In
    googleLoading,
    handleGoogleSignIn,
  };
}
