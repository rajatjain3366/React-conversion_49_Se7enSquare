import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { appealService } from '../../services/appealService';
import { logout } from './authSlice';

/**
 * Appeal slice (user side): the active ban/suspension being appealed and the
 * user's own appeals. The admin's appeal queue lives in adminModerationSlice.
 */

const hasUser = (_, { getState }) => Boolean(getState().auth.user?.id);

// Newest active ban/suspension from GET /sanctions/mine, or null.
// Backend SanctionRecord: status 'active' | 'reversed', expiresAt null = permanent.
export const fetchActiveSanction = createAsyncThunk(
  'appeal/fetchActiveSanction',
  async () => {
    const sanctions = await apiRequest('/sanctions/mine');
    if (!Array.isArray(sanctions)) return null;
    const now = Date.now();
    const active = [...sanctions].reverse().find(
      (s) => s.status === 'active' &&
        (s.type === 'ban' || s.type === 'suspend') &&
        (!s.expiresAt || new Date(s.expiresAt).getTime() > now)
    );
    return active
      ? {
          type: active.type === 'ban' ? 'Account Ban' : 'Account Suspension',
          reason: active.reason || 'Violation of community guidelines',
          until: active.expiresAt || null,
          id: `SAN-${active.id}`,
        }
      : null;
  },
  { condition: hasUser }
);

export const fetchMyAppeals = createAsyncThunk(
  'appeal/fetchMine',
  async (_, { getState }) => {
    const userId = getState().auth.user.id;
    const data = await appealService.getAppeals(userId);
    return Array.isArray(data) ? data.filter((a) => String(a.userId) === String(userId)) : [];
  },
  { condition: hasUser }
);

// Resolves with the real appeal id from the backend (shown as the reference number)
export const submitAppeal = createAsyncThunk('appeal/submit', async (payload, { dispatch }) => {
  const data = await appealService.createAppeal(payload);
  dispatch(fetchMyAppeals());
  return data.id;
});

const initialState = {
  sanction: null,
  myAppeals: [],
  loadingAppeals: false,
  submitting: false,
};

const appealSlice = createSlice({
  name: 'appeal',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveSanction.fulfilled, (state, action) => {
        state.sanction = action.payload;
      })
      .addCase(fetchMyAppeals.pending, (state) => {
        state.loadingAppeals = true;
      })
      .addCase(fetchMyAppeals.fulfilled, (state, action) => {
        state.loadingAppeals = false;
        state.myAppeals = action.payload;
      })
      .addCase(fetchMyAppeals.rejected, (state) => {
        state.loadingAppeals = false;
      })
      .addCase(submitAppeal.pending, (state) => {
        state.submitting = true;
      })
      .addCase(submitAppeal.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(submitAppeal.rejected, (state) => {
        state.submitting = false;
      })
      .addCase(logout, () => initialState);
  },
});

export const selectAppealState = (state) => state.appeal;

export default appealSlice.reducer;
