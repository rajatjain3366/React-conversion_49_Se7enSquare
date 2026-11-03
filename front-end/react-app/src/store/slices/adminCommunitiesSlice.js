import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { logout } from './authSlice';
import { addAuditEntry } from './auditLogSlice';

/**
 * Admin communities slice: community list plus suspend/reinstate
 * (POST /admin/communities/:id/suspend|reinstate from AdminCommunitiesController).
 */

export const fetchCommunities = createAsyncThunk('adminCommunities/fetch', async () => {
  const data = await apiRequest('/communities');
  return Array.isArray(data) ? data : [];
});

const communityLabel = (communities, communityId) =>
  communities.find((c) => c.id === communityId)?.name || `community #${communityId}`;

export const suspendCommunity = createAsyncThunk(
  'adminCommunities/suspend',
  async ({ communityId, reason }, { getState, dispatch }) => {
    const target = communityLabel(getState().adminCommunities.communities, communityId);
    await apiRequest(`/admin/communities/${communityId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    dispatch(addAuditEntry({ action: 'Community Suspended', target, reason }));
    await dispatch(fetchCommunities());
  }
);

export const reinstateCommunity = createAsyncThunk(
  'adminCommunities/reinstate',
  async (communityId, { getState, dispatch }) => {
    const target = communityLabel(getState().adminCommunities.communities, communityId);
    const reason = 'Reinstated by admin';
    await apiRequest(`/admin/communities/${communityId}/reinstate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    dispatch(addAuditEntry({ action: 'Community Reinstated', target, reason }));
    await dispatch(fetchCommunities());
  }
);

const adminCommunitiesSlice = createSlice({
  name: 'adminCommunities',
  initialState: { communities: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.communities = action.payload;
      })
      .addCase(logout, () => ({ communities: [] }));
  },
});

export const selectAdminCommunities = (state) => state.adminCommunities.communities;

export default adminCommunitiesSlice.reducer;
