import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { storeUserSession, clearUserSession } from '../services/api';
import { loginSuccess, profileUpdated, logout } from './slices/authSlice';
import { toastShown, toastHidden, sidebarToggled, SIDEBAR_KEY } from './slices/uiSlice';
import { JOINED_KEY } from './slices/communitiesSlice';

/**
 * Side effects that run after an action has updated the store.
 * - Keeps localStorage in sync with the auth slice, because apiRequest() and the
 *   fetch shim in main.jsx read the x-user-id / x-role headers from localStorage.
 * - Hides the toast after its duration.
 * - Saves the sidebar collapsed flag.
 * - Caches the joined community ids so the first paint is right before the server answers.
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

listenerMiddleware.startListening({
  actionCreator: toastShown,
  effect: async (action, listenerApi) => {
    // A newer toast cancels the previous timer, so it gets its full duration
    listenerApi.cancelActiveListeners();
    await listenerApi.delay(action.payload.duration);
    listenerApi.dispatch(toastHidden());
  },
});

listenerMiddleware.startListening({
  actionCreator: sidebarToggled,
  effect: (_action, listenerApi) => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(listenerApi.getState().ui.sidebarCollapsed));
    } catch { /* storage unavailable */ }
  },
});

// Runs for any action that changed joinedIds (join, leave, membership fetch, create, delete, logout)
listenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) =>
    currentState.communities.joinedIds !== previousState.communities.joinedIds,
  effect: (_action, listenerApi) => {
    try {
      localStorage.setItem(JOINED_KEY, JSON.stringify(listenerApi.getState().communities.joinedIds));
    } catch { /* storage unavailable */ }
  },
});
