import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { logout } from './authSlice';

/**
 * Communities slice, shared by Discovery, Community Page and Create Community:
 * - list: public communities (suspended ones hidden)
 * - joinedIds: communities the logged-in user belongs to; joining on one page
 *   shows on every other page immediately
 * - current: the community open on the Community Page, with its members and events
 */

export const JOINED_KEY = 'nexus_joined_communities';

function readJoinedIds() {
  try {
    const list = JSON.parse(localStorage.getItem(JOINED_KEY) || '[]');
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
}

const isActive = (c) => (c.status || 'active').toLowerCase() !== 'suspended';

export const fetchCommunityList = createAsyncThunk('communities/fetchList', async () => {
  const data = await apiRequest('/communities');
  return Array.isArray(data) ? data.filter(isActive) : [];
});

// The server's memberships are the source of truth for joinedIds
export const fetchMyMemberships = createAsyncThunk(
  'communities/fetchMyMemberships',
  async (_, { getState }) => {
    const userId = getState().auth.user?.id;
    const mems = await apiRequest(`/memberships?userId=${userId}`);
    return Array.isArray(mems) ? mems.map((m) => String(m.communityId)) : [];
  },
  // Skip the request when nobody is logged in
  { condition: (_, { getState }) => Boolean(getState().auth.user?.id) }
);

export const joinCommunity = createAsyncThunk('communities/join', async (communityId, { getState }) => {
  const userId = getState().auth.user?.id;
  try {
    await apiRequest('/memberships', {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId), communityId: Number(communityId) }),
    });
  } catch (err) {
    // Duplicate joins are harmless: the membership already exists
    if (!/already a member/i.test(err.message)) throw err;
  }
  return String(communityId);
});

export const leaveCommunity = createAsyncThunk('communities/leave', async (communityId, { getState }) => {
  const userId = getState().auth.user?.id;
  const mems = await apiRequest(`/memberships?userId=${userId}`);
  const target = Array.isArray(mems)
    ? mems.find((m) => String(m.communityId) === String(communityId) && String(m.userId) === String(userId))
    : null;
  if (target) {
    await apiRequest(`/memberships/${target.id}`, { method: 'DELETE' });
  }
  return String(communityId);
});

// Community Page: the community record itself
export const fetchCommunityPage = createAsyncThunk('communities/fetchPage', async (id) => {
  try {
    return await apiRequest(`/communities/${id}`);
  } catch (err) {
    throw new Error(
      err.isNetworkError
        ? 'Could not reach the backend. Is the NestJS server running?'
        : `Could not load community — ${err.message}`,
      { cause: err }
    );
  }
});

// Community Page: approved events and the member list, loaded after the community
export const fetchCommunityExtras = createAsyncThunk('communities/fetchExtras', async (community) => {
  const [allEvents, mems, users] = await Promise.all([
    apiRequest('/events').catch(() => []),
    apiRequest(`/memberships?communityId=${community.id}`).catch(() => []),
    apiRequest(`/users?communityId=${community.id}`).catch(() => []),
  ]);

  const events = (Array.isArray(allEvents) ? allEvents : []).filter(
    (e) => String(e.communityId) === String(community.id) && e.status === 'approved'
  );

  const usersById = new Map((Array.isArray(users) ? users : []).map((u) => [String(u.id), u]));
  const members = (Array.isArray(mems) ? mems : []).map((m) => {
    const u = usersById.get(String(m.userId));
    const isOwner = u && String(u.id) === String(community.ownerId);
    const isMod = !isOwner && (u?.role === 'moderator' || u?.role === 'community_manager');
    return {
      userId: m.userId,
      name: u ? (u.fullName || u.username) : `User #${m.userId}`,
      avatar: u?.avatar,
      role: isOwner ? 'owner' : (isMod ? 'moderator' : 'member'),
      status: u?.status || 'active',
    };
  });

  return { communityId: String(community.id), events, members };
});

export const deleteCommunity = createAsyncThunk('communities/delete', async (id) => {
  await apiRequest(`/communities/${id}`, { method: 'DELETE' });
  return String(id);
});

export const createCommunity = createAsyncThunk('communities/create', async (payload) => {
  const created = await apiRequest('/communities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!created?.id) throw new Error('Unexpected response from the server.');
  return created;
});

// Channels live on the community record: there is no /channels API
export const addChannel = createAsyncThunk('communities/addChannel', async ({ communityId, name, type }) => {
  const community = await apiRequest(`/communities/${communityId}`);
  const existing = Array.isArray(community?.channels) ? community.channels : [];
  const channel = {
    id: String(Date.now()),
    name: name.trim().toLowerCase().replace(/\s+/g, '-'),
    type,
  };
  await apiRequest(`/communities/${communityId}`, {
    method: 'PATCH',
    body: JSON.stringify({ channels: [...existing, channel] }),
  });
  return { communityName: community.name, channel };
});

const emptyCurrent = { community: null, loading: true, error: '', members: null, events: [] };

const initialState = {
  list: [],
  listLoading: true,
  listError: '',
  joinedIds: readJoinedIds(),
  current: emptyCurrent,
};

const addId = (ids, id) => (ids.includes(id) ? ids : [...ids, id]);
const removeId = (ids, id) => ids.filter((x) => x !== id);

const communitiesSlice = createSlice({
  name: 'communities',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // List
      .addCase(fetchCommunityList.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchCommunityList.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
        state.listError = '';
      })
      .addCase(fetchCommunityList.rejected, (state, action) => {
        state.listLoading = false;
        state.list = [];
        state.listError = action.error.message || 'Could not load communities.';
      })
      .addCase(fetchMyMemberships.fulfilled, (state, action) => {
        state.joinedIds = action.payload;
      })

      // Join / leave: optimistic. pending updates the UI at once, rejected undoes it.
      .addCase(joinCommunity.pending, (state, action) => {
        state.joinedIds = addId(state.joinedIds, String(action.meta.arg));
      })
      .addCase(joinCommunity.rejected, (state, action) => {
        state.joinedIds = removeId(state.joinedIds, String(action.meta.arg));
      })
      .addCase(leaveCommunity.pending, (state, action) => {
        state.joinedIds = removeId(state.joinedIds, String(action.meta.arg));
      })
      .addCase(leaveCommunity.rejected, (state, action) => {
        state.joinedIds = addId(state.joinedIds, String(action.meta.arg));
      })

      // Community Page
      .addCase(fetchCommunityPage.pending, (state, action) => {
        // Opening a different community must not show the previous one's data
        if (String(state.current.community?.id) !== String(action.meta.arg)) {
          state.current = { ...emptyCurrent };
        } else {
          state.current.loading = true;
        }
      })
      .addCase(fetchCommunityPage.fulfilled, (state, action) => {
        state.current.loading = false;
        state.current.community = action.payload;
        state.current.error = '';
      })
      .addCase(fetchCommunityPage.rejected, (state, action) => {
        state.current.loading = false;
        state.current.community = null;
        state.current.error = action.error.message;
      })
      .addCase(fetchCommunityExtras.fulfilled, (state, action) => {
        // Ignore a late response for a community that is no longer open
        if (String(state.current.community?.id) !== action.payload.communityId) return;
        state.current.events = action.payload.events;
        state.current.members = action.payload.members;
      })
      .addCase(fetchCommunityExtras.rejected, (state) => {
        state.current.members = [];
      })

      // Create / delete
      .addCase(createCommunity.fulfilled, (state, action) => {
        const created = action.payload;
        if (isActive(created)) state.list.push(created);
        state.joinedIds = addId(state.joinedIds, String(created.id));
      })
      .addCase(deleteCommunity.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => String(c.id) !== action.payload);
        state.joinedIds = removeId(state.joinedIds, action.payload);
      })

      // The next user must not inherit this user's memberships
      .addCase(logout, (state) => {
        state.joinedIds = [];
        state.current = emptyCurrent;
      });
  },
});

export const selectCommunityList = (state) => state.communities.list;
export const selectCommunityListLoading = (state) => state.communities.listLoading;
export const selectCommunityListError = (state) => state.communities.listError;
export const selectJoinedIds = (state) => state.communities.joinedIds;
export const selectCurrentCommunity = (state) => state.communities.current;

export default communitiesSlice.reducer;
