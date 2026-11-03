import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { DEFAULT_COMMUNITY } from '../../Components/platform/data/defaultCommunityData';
import { logout } from './authSlice';

/**
 * Community Settings slice: the community being edited (a draft), a snapshot
 * of what the server has (for Discard), and the dirty flag (for the Save bar).
 */

// Loads the community, its memberships and users in parallel and shapes them for the form
export const fetchCommunitySettings = createAsyncThunk(
  'communitySettings/fetch',
  async (communityId) => {
    const [data, mems, usrs] = await Promise.all([
      apiRequest(`/communities/${communityId}`),
      // The member list is optional: the form still works without it
      apiRequest(`/memberships?communityId=${communityId}`).catch(() => null),
      apiRequest(`/users?communityId=${communityId}`).catch(() => null),
    ]);

    let members = [];
    if (Array.isArray(mems) && Array.isArray(usrs)) {
      const usersById = new Map(usrs.map((u) => [String(u.id), u]));
      members = mems.map((m) => {
        const u = usersById.get(String(m.userId)) || {};
        const uName = u.fullName || u.name || u.username || `User #${m.userId}`;
        return {
          id: m.id,
          userId: m.userId,
          name: uName,
          handle: `@${u.username || 'user'}`,
          role: u.id === data.ownerId ? 'Owner' : (u.role || 'Member'),
          initials: uName.slice(0, 2).toUpperCase(),
        };
      });
    }

    return {
      ...DEFAULT_COMMUNITY,
      ...data,
      members,
      // The rules textarea edits one rule per line
      rules: Array.isArray(data.rules) ? data.rules.join('\n') : data.rules || DEFAULT_COMMUNITY.rules,
      channels: Array.isArray(data.channels)
        ? data.channels.map((ch, idx) => (typeof ch === 'string' ? { id: idx + 1, name: ch, type: 'Text' } : ch))
        : DEFAULT_COMMUNITY.channels,
    };
  }
);

// PATCH /communities/:id with the draft from the store
export const saveCommunitySettings = createAsyncThunk(
  'communitySettings/save',
  async (_, { getState }) => {
    const { communityId, community } = getState().communitySettings;

    const rules = typeof community.rules === 'string'
      ? community.rules.split('\n').map((r) => r.trim()).filter(Boolean)
      : community.rules;

    // Normalise channels to plain objects the backend can store
    const channels = (community.channels || []).map((ch, idx) => ({
      id: ch.id ? String(ch.id) : (ch.name ? String(ch.name) : String(idx + 1)),
      name: ch.name,
      type: ch.type || 'Text',
      topic: ch.topic || `#${ch.name} channel`,
    }));

    return apiRequest(`/communities/${communityId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: community.name,
        description: community.description,
        banner: community.banner || undefined,
        rules,
        channels,
      }),
    });
  }
);

// DELETE /memberships/:id takes effect immediately (not on Save)
export const removeMember = createAsyncThunk(
  'communitySettings/removeMember',
  async (memberId) => {
    await apiRequest(`/memberships/${memberId}`, { method: 'DELETE' });
    return memberId;
  }
);

// Uploads the image first and keeps only the short URL; the banner DTO allows max 300 chars
export const uploadBanner = createAsyncThunk(
  'communitySettings/uploadBanner',
  async (file) => {
    const upload = new FormData();
    upload.append('file', file);
    const { fileUrl } = await apiRequest('/uploads', { method: 'POST', body: upload });
    return fileUrl;
  }
);

const initialState = {
  communityId: null,
  community: DEFAULT_COMMUNITY,
  initialCommunity: DEFAULT_COMMUNITY,
  loading: true,
  saving: false,
  isDirty: false,
};

const communitySettingsSlice = createSlice({
  name: 'communitySettings',
  initialState,
  reducers: {
    fieldChanged(state, action) {
      const { field, value } = action.payload;
      state.community[field] = value;
      state.isDirty = true;
    },
    memberRoleChanged(state, action) {
      const { memberId, role } = action.payload;
      const member = state.community.members.find((m) => m.id === memberId);
      if (member) member.role = role;
      state.isDirty = true;
    },
    channelDeleted(state, action) {
      state.community.channels = state.community.channels.filter((c) => c.id !== action.payload);
      state.isDirty = true;
    },
    channelCreated: {
      reducer(state, action) {
        state.community.channels.push(action.payload);
        state.isDirty = true;
      },
      // prepare() builds the new channel: reducers must not call Date.now()
      prepare({ name, type }) {
        const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
        return { payload: { id: Date.now(), name: cleanName, type } };
      },
    },
    changesDiscarded(state) {
      state.community = state.initialCommunity;
      state.isDirty = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunitySettings.pending, (state, action) => {
        // Opening another community must not show the previous one's data
        if (action.meta.arg !== state.communityId) {
          state.community = DEFAULT_COMMUNITY;
          state.initialCommunity = DEFAULT_COMMUNITY;
        }
        state.communityId = action.meta.arg;
        state.loading = true;
        state.isDirty = false;
      })
      .addCase(fetchCommunitySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.community = action.payload;
        state.initialCommunity = action.payload;
      })
      .addCase(fetchCommunitySettings.rejected, (state) => {
        // Keep the fallback data, as before
        state.loading = false;
      })
      .addCase(saveCommunitySettings.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveCommunitySettings.fulfilled, (state, action) => {
        const saved = action.payload;
        const updated = saved && typeof saved === 'object'
          ? {
              ...state.community,
              ...saved,
              rules: Array.isArray(saved.rules) ? saved.rules.join('\n') : (saved.rules || state.community.rules),
              channels: Array.isArray(saved.channels) ? saved.channels : state.community.channels,
            }
          : state.community;
        state.community = updated;
        state.initialCommunity = updated;
        state.saving = false;
        state.isDirty = false;
      })
      .addCase(saveCommunitySettings.rejected, (state) => {
        state.saving = false;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        const keep = (m) => m.id !== action.payload;
        state.community.members = state.community.members.filter(keep);
        state.initialCommunity.members = state.initialCommunity.members.filter(keep);
      })
      .addCase(uploadBanner.fulfilled, (state, action) => {
        state.community.banner = action.payload;
        state.isDirty = true;
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  fieldChanged,
  memberRoleChanged,
  channelDeleted,
  channelCreated,
  changesDiscarded,
} = communitySettingsSlice.actions;

export const selectCommunitySettings = (state) => state.communitySettings;

export default communitySettingsSlice.reducer;
