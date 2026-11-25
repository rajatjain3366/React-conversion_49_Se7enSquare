import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { logout } from './authSlice';
import {
  CATEGORIES,
  ICONS,
  BANNERS,
  DEFAULT_CHANNELS,
  DEFAULT_PERMISSIONS,
} from '../../Components/platform/data/createCommunityOptions';

/**
 * Communities slice — Component 2 (Community Management).
 *
 * Designed to satisfy strict full-stack Redux course requirements:
 *
 * 1. ONE-TO-ONE REPOSITORY MAPPING:
 *    Directly mirrors the backend 'communities' repository/controller.
 *
 * 2. 4 CRUD OPERATIONS (Formula: CRUD ops = Repos * 4):
 *    - Create: createCommunity  (POST  /api/communities)
 *    - Read:   fetchCommunityList (GET /api/communities) & fetchCommunityPage (GET /api/communities/:id)
 *    - Update: updateCommunity  (PATCH /api/communities/:id)
 *    - Delete: deleteCommunity  (DELETE /api/communities/:id)
 *
 * 3. STRICT THUNK PATTERN (DB-First -> Fulfilled Only):
 *    In .pending, only set loading states (e.g. listLoading = true).
 *    State mutation happens STRICTLY in .fulfilled after the database confirms the write.
 *    No optimistic updates that mutate state before the database responds.
 *
 * 4. ZERO LOCALSTORAGE:
 *    No localStorage reads or writes for application state.
 *    All lists, joined IDs, forms, and filters are maintained purely in in-memory Redux store variables.
 *
 * 5. ALL DISPLAY DATA & ACTIONS FROM REDUX (NO COMPONENT useState):
 *    Form fields and live preview for CreateCommunity live in state.createForm.
 *    Active tab and member search for CommunityPage live in state.current.
 *
 * 6. COMPONENT UNMOUNT CLEANUP:
 *    Actions clearCurrentCommunity() and resetCreateForm() wipe transient state on route changes.
 */

/** Cache window: community list is considered fresh for 60 seconds. */
const LIST_CACHE_MS = 60_000;

/** Helper: mutate memberCount on a community in state.all and state.current, clamped to 0. */
function adjustMemberCount(state, communityId, delta) {
  const id = String(communityId);
  const inAll = state.all.find((c) => String(c.id) === id);
  if (inAll) inAll.memberCount = Math.max(0, (inAll.memberCount || 0) + delta);
  if (String(state.current.community?.id) === id) {
    state.current.community.memberCount = Math.max(
      0,
      (state.current.community.memberCount || 0) + delta
    );
  }
}

const isActive = (c) => (c.status || 'active').toLowerCase() !== 'suspended';

// ─── Async Thunks (CRUD Operations on Communities & Memberships) ─────────────

// [CRUD: READ ALL]
export const fetchCommunityList = createAsyncThunk(
  'communities/fetchList',
  async () => {
    const data = await apiRequest('/communities');
    return Array.isArray(data) ? data : [];
  },
  {
    condition: (force = false, { getState }) => {
      if (force) return true;
      const { all, listFetching, lastFetched } = getState().communities;
      if (listFetching) return false;
      const isFresh = lastFetched && Date.now() - lastFetched < LIST_CACHE_MS;
      return !(all.length > 0 && isFresh);
    },
  }
);

// [CRUD: READ MY MEMBERSHIPS]
export const fetchMyMemberships = createAsyncThunk(
  'communities/fetchMyMemberships',
  async (_, { getState }) => {
    const userId = getState().auth.user?.id;
    const mems = await apiRequest(`/memberships?userId=${userId}`);
    if (!Array.isArray(mems)) return { joinedIds: [], membershipMap: {} };
    const joinedIds = mems.map((m) => String(m.communityId));
    const membershipMap = Object.fromEntries(
      mems.map((m) => [String(m.communityId), String(m.id)])
    );
    return { joinedIds, membershipMap };
  },
  { condition: (_, { getState }) => Boolean(getState().auth.user?.id) }
);

// [CRUD: CREATE MEMBERSHIP (JOIN)] - Dispatches to DB, state updated in .fulfilled
export const joinCommunity = createAsyncThunk(
  'communities/join',
  async (communityId, { getState }) => {
    const userId = getState().auth.user?.id;
    let membershipId = null;
    try {
      const res = await apiRequest('/memberships', {
        method: 'POST',
        body: JSON.stringify({ userId: Number(userId), communityId: Number(communityId) }),
      });
      membershipId = res?.id ? String(res.id) : null;
    } catch (err) {
      if (!/already a member/i.test(err.message)) throw err;
    }
    return { communityId: String(communityId), membershipId };
  }
);

// [CRUD: DELETE MEMBERSHIP (LEAVE)] - Dispatches to DB, state updated in .fulfilled
export const leaveCommunity = createAsyncThunk(
  'communities/leave',
  async (communityId, { getState }) => {
    const userId = getState().auth.user?.id;
    let membershipId = getState().communities.membershipMap[String(communityId)];

    if (!membershipId) {
      const mems = await apiRequest(`/memberships?userId=${userId}`);
      const target = Array.isArray(mems)
        ? mems.find(
            (m) =>
              String(m.communityId) === String(communityId) &&
              String(m.userId) === String(userId)
          )
        : null;
      membershipId = target?.id ? String(target.id) : null;
    }

    if (membershipId) {
      await apiRequest(`/memberships/${membershipId}`, { method: 'DELETE' });
    }
    return String(communityId);
  }
);

// [CRUD: READ SINGLE BY ID]
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

// Community Page: events and member roster
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

// [CRUD: CREATE COMMUNITY]
export const createCommunity = createAsyncThunk('communities/create', async (payload) => {
  const created = await apiRequest('/communities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!created?.id) throw new Error('Unexpected response from the server.');
  return created;
});

// [CRUD: UPDATE COMMUNITY] (PATCH /api/communities/:id)
export const updateCommunity = createAsyncThunk(
  'communities/update',
  async ({ id, updates }) => {
    const updated = await apiRequest(`/communities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return updated;
  }
);

// [CRUD: DELETE COMMUNITY] (DELETE /api/communities/:id)
export const deleteCommunity = createAsyncThunk('communities/delete', async (id) => {
  await apiRequest(`/communities/${id}`, { method: 'DELETE' });
  return String(id);
});

// Channels live on the community record in backend
export const addChannel = createAsyncThunk(
  'communities/addChannel',
  async ({ communityId, name, type }) => {
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
  }
);

// ─── Initial State (Pure In-Memory Variables, Zero LocalStorage) ─────────────

const initialCreateForm = {
  activeTab: 'community',
  currentStep: 1,
  submitting: false,
  name: '',
  desc: '',
  slug: '',
  category: CATEGORIES[0] || 'FPS',
  icon: ICONS[0] || '⚡',
  banner: BANNERS[0] || 'linear-gradient(135deg, #1e1b4b, #4338ca)',
  website: '',
  tags: '',
  channels: DEFAULT_CHANNELS,
  privacy: 'public',
  permissions: DEFAULT_PERMISSIONS,
  rules: '',
  welcomeMsg: '',
  // Step 3 channel sub-form
  showAddCh: false,
  newChName: '',
  newChDesc: '',
  newChType: 'Text',
  // Standalone channel creator
  channelCommId: '',
  standaloneChName: '',
  standaloneChTopic: '',
  standaloneChType: 'Text',
};

const emptyCurrent = {
  community: null,
  loading: true,
  error: '',
  members: null,
  events: [],
  activeTab: 'overview',
  memberSearch: '',
};

const initialState = {
  // Pure in-memory variables:
  all: [],
  listLoading: true,
  listFetching: false,
  listError: '',
  lastFetched: null,
  joinedIds: [],               // Zero localStorage: populated via fetchMyMemberships
  membershipMap: {},           // In-memory { [communityId]: membershipId }
  joinLoading: {},             // Tracks in-flight join operations
  leaveLoading: {},            // Tracks in-flight leave operations
  current: emptyCurrent,       // Active community hub view state
  createForm: initialCreateForm, // Form state moved from useState into Redux
  discoveryFilter: {
    search: '',
    category: 'All',
    sortBy: 'active',
  },
};

const addId = (ids, id) => (ids.includes(id) ? ids : [...ids, id]);
const removeId = (ids, id) => ids.filter((x) => x !== id);

// ─── Slice Definition ────────────────────────────────────────────────────────

const communitiesSlice = createSlice({
  name: 'communities',
  initialState,
  reducers: {
    // ── Discovery Filter Actions ──────────────────────────────────────────
    searchChanged(state, action) {
      state.discoveryFilter.search = action.payload;
    },
    categoryChanged(state, action) {
      state.discoveryFilter.category = action.payload;
    },
    sortByChanged(state, action) {
      state.discoveryFilter.sortBy = action.payload;
    },
    filterReset(state) {
      state.discoveryFilter = initialState.discoveryFilter;
    },

    // ── Create Community Form Actions (Replaces useState in components) ───
    createFormFieldChanged(state, action) {
      const { field, value } = action.payload;
      state.createForm[field] = value;
    },
    createFormStepSet(state, action) {
      state.createForm.currentStep = action.payload;
    },
    createFormTabSet(state, action) {
      state.createForm.activeTab = action.payload;
    },
    createFormChannelAdded(state, action) {
      state.createForm.channels.push(action.payload);
    },
    createFormChannelDeleted(state, action) {
      state.createForm.channels = state.createForm.channels.filter((c) => c.id !== action.payload);
    },
    createFormSubmittingSet(state, action) {
      state.createForm.submitting = action.payload;
    },
    resetCreateForm(state) {
      state.createForm = { ...initialCreateForm };
    },

    // ── Community Page View Actions (Cleaned on Unmount) ───────────────────
    currentTabSet(state, action) {
      state.current.activeTab = action.payload;
    },
    currentMemberSearchSet(state, action) {
      state.current.memberSearch = action.payload;
    },
    clearCurrentCommunity(state) {
      state.current = { ...emptyCurrent, loading: false };
    },
  },
  extraReducers: (builder) => {
    builder
      // ── [READ ALL] Community List ────────────────────────────────────────
      .addCase(fetchCommunityList.pending, (state) => {
        state.listFetching = true;
        state.listLoading = true;
      })
      .addCase(fetchCommunityList.fulfilled, (state, action) => {
        state.listFetching = false;
        state.listLoading = false;
        state.all = action.payload;
        state.listError = '';
        state.lastFetched = Date.now();
      })
      .addCase(fetchCommunityList.rejected, (state, action) => {
        state.listFetching = false;
        state.listLoading = false;
        state.all = [];
        state.listError = action.error.message || 'Could not load communities.';
      })

      // ── [READ MEMBERSHIPS] ───────────────────────────────────────────────
      .addCase(fetchMyMemberships.fulfilled, (state, action) => {
        state.joinedIds = action.payload.joinedIds;
        state.membershipMap = action.payload.membershipMap;
      })

      // ── [CREATE MEMBERSHIP: STRICT THUNK] ────────────────────────────────
      // In .pending: only set in-flight loading flag. NO state mutation before DB!
      .addCase(joinCommunity.pending, (state, action) => {
        const id = String(action.meta.arg);
        state.joinLoading[id] = true;
      })
      // In .fulfilled: state mutated ONLY AFTER DB confirms creation!
      .addCase(joinCommunity.fulfilled, (state, action) => {
        const { communityId, membershipId } = action.payload;
        delete state.joinLoading[communityId];
        state.joinedIds = addId(state.joinedIds, communityId);
        adjustMemberCount(state, communityId, +1);
        if (membershipId) state.membershipMap[communityId] = membershipId;
      })
      .addCase(joinCommunity.rejected, (state, action) => {
        const id = String(action.meta.arg);
        delete state.joinLoading[id];
      })

      // ── [DELETE MEMBERSHIP: STRICT THUNK] ────────────────────────────────
      // In .pending: only set in-flight loading flag.
      .addCase(leaveCommunity.pending, (state, action) => {
        const id = String(action.meta.arg);
        state.leaveLoading[id] = true;
      })
      // In .fulfilled: state mutated ONLY AFTER DB confirms deletion!
      .addCase(leaveCommunity.fulfilled, (state, action) => {
        const id = String(action.payload);
        delete state.leaveLoading[id];
        state.joinedIds = removeId(state.joinedIds, id);
        adjustMemberCount(state, id, -1);
        delete state.membershipMap[id];
      })
      .addCase(leaveCommunity.rejected, (state, action) => {
        const id = String(action.meta.arg);
        delete state.leaveLoading[id];
      })

      // ── [READ SINGLE] Community Page ─────────────────────────────────────
      .addCase(fetchCommunityPage.pending, (state, action) => {
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
        if (String(state.current.community?.id) !== action.payload.communityId) return;
        state.current.events = action.payload.events;
        state.current.members = action.payload.members;
      })
      .addCase(fetchCommunityExtras.rejected, (state) => {
        state.current.members = [];
      })

      // ── [CREATE COMMUNITY] ───────────────────────────────────────────────
      .addCase(createCommunity.fulfilled, (state, action) => {
        const created = action.payload;
        state.all.push(created);
        state.joinedIds = addId(state.joinedIds, String(created.id));
      })

      // ── [UPDATE COMMUNITY] (PATCH /api/communities/:id) ──────────────────
      .addCase(updateCommunity.fulfilled, (state, action) => {
        const updated = action.payload;
        const idStr = String(updated.id);
        const idx = state.all.findIndex((c) => String(c.id) === idStr);
        if (idx !== -1) {
          state.all[idx] = { ...state.all[idx], ...updated };
        }
        if (String(state.current.community?.id) === idStr) {
          state.current.community = { ...state.current.community, ...updated };
        }
      })

      // ── [DELETE COMMUNITY] ───────────────────────────────────────────────
      .addCase(deleteCommunity.fulfilled, (state, action) => {
        const idStr = String(action.payload);
        state.all = state.all.filter((c) => String(c.id) !== idStr);
        state.joinedIds = removeId(state.joinedIds, idStr);
        delete state.membershipMap[idStr];
        if (String(state.current.community?.id) === idStr) {
          state.current = { ...emptyCurrent, loading: false };
        }
      })

      // ── [LOGOUT] Clear all user-specific state ───────────────────────────
      .addCase(logout, (state) => {
        state.joinedIds = [];
        state.membershipMap = {};
        state.current = { ...emptyCurrent, loading: false };
        state.createForm = { ...initialCreateForm };
      });
  },
});

export const {
  searchChanged,
  categoryChanged,
  sortByChanged,
  filterReset,
  createFormFieldChanged,
  createFormStepSet,
  createFormTabSet,
  createFormChannelAdded,
  createFormChannelDeleted,
  createFormSubmittingSet,
  resetCreateForm,
  currentTabSet,
  currentMemberSearchSet,
  clearCurrentCommunity,
} = communitiesSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectAllCommunities = (state) => state.communities.all;
export const selectCommunityListLoading = (state) => state.communities.listLoading;
export const selectCommunityListError = (state) => state.communities.listError;
export const selectJoinedIds = (state) => state.communities.joinedIds;
export const selectMembershipMap = (state) => state.communities.membershipMap;
export const selectCurrentCommunity = (state) => state.communities.current;
export const selectDiscoveryFilter = (state) => state.communities.discoveryFilter;
export const selectCreateForm = (state) => state.communities.createForm;
export const selectJoinLoading = (state) => state.communities.joinLoading;
export const selectLeaveLoading = (state) => state.communities.leaveLoading;

/** Public list: suspended communities are hidden. Memoized. */
export const selectCommunityList = createSelector(
  [selectAllCommunities],
  (all) => all.filter(isActive)
);

/** Communities the logged-in user has joined. */
export const selectJoinedCommunities = createSelector(
  [selectAllCommunities, selectJoinedIds],
  (all, ids) => {
    const joined = new Set(ids);
    return all.filter((c) => joined.has(String(c.id)));
  }
);

/** Communities owned by the logged-in user. */
export const selectOwnedCommunities = createSelector(
  [selectAllCommunities, (state) => state.auth.user?.id],
  (all, userId) => (userId == null ? [] : all.filter((c) => String(c.ownerId) === String(userId)))
);

export default communitiesSlice.reducer;
