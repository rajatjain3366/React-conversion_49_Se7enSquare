import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import { listenerMiddleware } from './listenerMiddleware';

/**
 * Single Redux store for the whole app.
 * Each feature adds its slice under `reducer`.
 * configureStore also enables Redux DevTools and the default thunk middleware.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  // The listener middleware goes first, as recommended by Redux Toolkit
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});
