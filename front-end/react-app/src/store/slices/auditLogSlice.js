import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { logout } from './authSlice';

/**
 * Audit log slice: administrative actions stored by the backend (GET/POST /audit-log).
 */

export const fetchAuditLog = createAsyncThunk('auditLog/fetch', async () => {
  const data = await apiRequest('/audit-log');
  return Array.isArray(data) ? data : [];
});

// Called by the admin thunks after an action succeeded. The actor is the logged-in admin.
export const addAuditEntry = createAsyncThunk(
  'auditLog/add',
  async ({ action, target, reason }, { getState, dispatch }) => {
    const actor = getState().auth.user?.username || 'admin';
    await apiRequest('/audit-log', {
      method: 'POST',
      body: JSON.stringify({
        action: String(action).slice(0, 100),
        actor: String(actor).slice(0, 60),
        ...(target ? { target: String(target).slice(0, 100) } : {}),
        ...(reason ? { reason: String(reason).slice(0, 200) } : {}),
      }),
    });
    await dispatch(fetchAuditLog());
  }
);

const auditLogSlice = createSlice({
  name: 'auditLog',
  initialState: { records: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLog.fulfilled, (state, action) => {
        state.records = action.payload;
      })
      .addCase(logout, () => ({ records: [] }));
  },
});

const selectAuditRecords = (state) => state.auditLog.records;

// Newest first, with display-ready fields. createSelector re-computes only when records change.
export const selectAuditEntries = createSelector([selectAuditRecords], (records) =>
  [...records]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((l) => ({
      id: l.id,
      time: l.createdAt
        ? new Date(l.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : '—',
      admin: l.actor || 'system',
      action: l.action,
      target: l.target || 'general',
      reason: l.reason || '',
    }))
);

export default auditLogSlice.reducer;
