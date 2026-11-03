import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { logout } from './authSlice';

/**
 * Notifications of the logged-in user (newest first, as the backend sends them).
 * "Mark all read" is optimistic: the dots disappear at once and the server is told after.
 */

const hasUser = (_, { getState }) => Boolean(getState().auth.user?.id);

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { getState }) => {
    const userId = getState().auth.user.id;
    const data = await apiRequest(`/notifications?userId=${encodeURIComponent(userId)}`);
    return Array.isArray(data) ? data : [];
  },
  { condition: hasUser }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { getState, dispatch }) => {
    const userId = getState().auth.user.id;
    try {
      await apiRequest('/notifications/read-all', {
        method: 'PATCH',
        body: JSON.stringify({ userId: Number(userId) }),
      });
    } catch (err) {
      // Undo the optimistic change by reloading what the server really has
      dispatch(fetchNotifications());
      throw err;
    }
  },
  { condition: hasUser }
);

const initialState = { items: [], loading: false };

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.items.forEach((n) => { n.read = true; });
      })
      .addCase(logout, () => initialState);
  },
});

export const selectNotifications = (state) => state.notifications.items;
export const selectNotificationsLoading = (state) => state.notifications.loading;

const iconOf = (type) => (type === 'reaction' ? '💬' : type === 'report_status' ? '🛡️' : '🔔');

// The 6 newest, shaped for the Dashboard list
export const selectRecentNotifications = createSelector([selectNotifications], (items) =>
  items.slice(0, 6).map((n) => ({
    id: n.id,
    icon: iconOf(n.type),
    text: n.text,
    time: n.createdAt
      ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Recently',
    read: n.read,
  }))
);

export const selectUnreadCount = createSelector(
  [selectNotifications],
  (items) => items.filter((n) => !n.read).length
);

export default notificationsSlice.reducer;
