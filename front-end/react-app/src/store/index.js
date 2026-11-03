import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import pricingReducer from './slices/pricingSlice';
import reportReducer from './slices/reportSlice';
import communitySettingsReducer from './slices/communitySettingsSlice';
import adminUsersReducer from './slices/adminUsersSlice';
import adminCommunitiesReducer from './slices/adminCommunitiesSlice';
import adminModerationReducer from './slices/adminModerationSlice';
import auditLogReducer from './slices/auditLogSlice';
import communitiesReducer from './slices/communitiesSlice';
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
    pricing: pricingReducer,
    report: reportReducer,
    communitySettings: communitySettingsReducer,
    adminUsers: adminUsersReducer,
    adminCommunities: adminCommunitiesReducer,
    adminModeration: adminModerationReducer,
    auditLog: auditLogReducer,
    communities: communitiesReducer,
  },
  // The listener middleware goes first, as recommended by Redux Toolkit
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});
