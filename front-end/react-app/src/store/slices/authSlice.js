import { createSlice } from '@reduxjs/toolkit';
import { getStoredUser, toSessionUser } from '../../services/api';

/**
 * Auth slice: the logged-in user, shared by every page.
 * Starts from localStorage so a page refresh keeps the session.
 * Writing back to localStorage is done by the listener middleware, not here,
 * because reducers must stay pure (no side effects).
 */
const initialState = {
  user: getStoredUser(),
};

// Login and profile updates both replace the session user with the whitelisted fields
const setSessionUser = {
  reducer(state, action) {
    state.user = action.payload;
  },
  prepare(user) {
    return { payload: toSessionUser(user) };
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: setSessionUser,
    profileUpdated: setSessionUser,
    logout(state) {
      state.user = null;
    },
  },
});

export const { loginSuccess, profileUpdated, logout } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectUserRole = (state) => (state.auth.user?.role || 'user').toLowerCase();
export const selectIsAuthenticated = (state) => {
  const user = state.auth.user;
  return Boolean(user && user.username && user.id !== undefined && user.id !== null);
};

export default authSlice.reducer;
