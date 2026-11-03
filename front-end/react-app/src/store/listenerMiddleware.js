import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { storeUserSession, clearUserSession } from '../services/api';
import { loginSuccess, profileUpdated, logout } from './slices/authSlice';

/**
 * Side effects that run after an action has updated the store.
 * Keeps localStorage in sync with the auth slice, because apiRequest() and the
 * fetch shim in main.jsx read the x-user-id / x-role headers from localStorage.
 */
export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: isAnyOf(loginSuccess, profileUpdated),
  effect: (action) => {
    storeUserSession(action.payload);
  },
});

listenerMiddleware.startListening({
  actionCreator: logout,
  effect: () => {
    clearUserSession();
  },
});
