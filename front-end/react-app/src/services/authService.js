/**
 * Authentication Service Module
 * Handles the login and registration API calls.
 * The session itself lives in the Redux auth slice: callers dispatch
 * loginSuccess(user) / logout(), and the store keeps localStorage in sync.
 */
import { apiRequest, getStoredUser } from './api';

export const authService = {
  /**
   * Log in with username/email and password.
   */
  async login({ login, password, role }) {
    const payload = {
      login: login.trim(),
      password,
      role: role || undefined,
    };
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Register a new user account.
   */
  async register({ username, email, password, role, firstName, lastName }) {
    const payload = {
      username: username.trim(),
      email: email.trim(),
      password,
      role: role || 'user',
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
    };
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Authenticate with verified Google credential or access token.
   */
  async loginWithGoogle({ credential, accessToken }) {
    const payload = {};
    if (credential) payload.credential = credential;
    if (accessToken) payload.accessToken = accessToken;

    return await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves active user or fallback.
   */
  getCurrentUser() {
    return getStoredUser();
  },

  /**
   * Check if user is logged in.
   */
  isAuthenticated() {
    const user = getStoredUser();
    return Boolean(user && user.username && user.id !== undefined && user.id !== null);
  },
};
