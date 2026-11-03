import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { eventService } from '../../Components/event-management/services/eventService';
import { logout } from './authSlice';
import { selectEvents } from './eventsSlice';

/**
 * Organizer slice: the organizer's plan, earnings and registration counts.
 * The tournaments themselves live in the events slice; selectMyEvents picks this
 * organizer's ones out of it.
 */

const FREE_PROFILE = { plan: 'free', limits: { maxActiveTournaments: 2, maxParticipants: 64 } };

export const fetchOrganizerData = createAsyncThunk('organizer/fetch', async (_, { getState }) => {
  const userId = getState().auth.user?.id;

  // Registration counts per event (non-critical)
  const regs = await eventService.getRegistrations().catch(() => []);
  const regCountByEvent = {};
  (Array.isArray(regs) ? regs : []).forEach((r) => {
    regCountByEvent[r.eventId] = (regCountByEvent[r.eventId] || 0) + 1;
  });

  if (!userId) return { regCountByEvent, profile: FREE_PROFILE, earnings: '0' };

  const [profile, analytics] = await Promise.all([
    apiRequest(`/organisers/profile?userId=${userId}`).catch(() => null),
    apiRequest(`/organisers/analytics?userId=${userId}`).catch(() => null),
  ]);

  return {
    regCountByEvent,
    profile: profile || FREE_PROFILE,
    earnings: Number(analytics?.estimatedOrganiserEarnings || 0).toLocaleString(),
  };
});

export const upgradeOrganizerPlan = createAsyncThunk('organizer/upgrade', async (_, { getState }) => {
  const userId = getState().auth.user?.id;
  if (userId) await eventService.upgradeOrganizerPlan(userId, 'premium');
});

// Puts a tournament in the Discover carousel for 7 days
export const promoteEvent = createAsyncThunk('organizer/promote', async (eventId, { getState }) => {
  await apiRequest('/featured-events', {
    method: 'POST',
    body: JSON.stringify({
      eventId: Number(eventId),
      userId: Number(getState().auth.user?.id),
      durationDays: 7,
    }),
  });
});

const initialState = {
  profile: null,
  earnings: '0',
  regCountByEvent: {},
  loading: true,
};

const organizerSlice = createSlice({
  name: 'organizer',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizerData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrganizerData.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.earnings = action.payload.earnings;
        state.regCountByEvent = action.payload.regCountByEvent;
      })
      .addCase(fetchOrganizerData.rejected, (state) => {
        state.loading = false;
        state.profile = FREE_PROFILE;
      })
      .addCase(upgradeOrganizerPlan.fulfilled, (state) => {
        state.profile = {
          ...state.profile,
          plan: 'premium',
          limits: { maxActiveTournaments: 'Unlimited', maxParticipants: 'Unlimited' },
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const selectOrganizer = (state) => state.organizer;

const selectAuthUser = (state) => state.auth.user;

// The logged-in organizer's tournaments, taken from the shared events slice
export const selectMyEvents = createSelector([selectEvents, selectAuthUser], (events, user) =>
  events.filter(
    (e) =>
      (user?.id && (e.organiserId === user.id || e.organizerId === user.id)) ||
      (user?.username && e.createdBy === user.username) ||
      (user?.name && e.createdBy === user.name)
  )
);

export default organizerSlice.reducer;
