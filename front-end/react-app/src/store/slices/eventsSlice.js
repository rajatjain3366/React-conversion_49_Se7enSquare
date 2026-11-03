import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { eventService } from '../../Components/event-management/services/eventService';
import { STORAGE_KEYS, EVENT_STATUSES } from '../../Components/event-management/utils/constants';
import { logout } from './authSlice';

/**
 * Events slice, shared by Events, Event Approval, Event Registrants, the Organizer
 * Dashboard and Discovery's event count:
 * - items: all events (with an offline fallback kept in localStorage)
 * - myRegistrations: the logged-in user's registrations
 * - registrants: the list shown on the Event Registrants page
 */

const sameId = (a, b) => Number(a) === Number(b) || String(a) === String(b);

// Offline fallback (STORAGE_KEYS.EVENTS), used only when the backend cannot be reached
const offline = {
  read() {
    try {
      const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  },
  write(items) {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(items));
    } catch { /* storage unavailable */ }
  },
  add(item) {
    this.write([item, ...this.read()]);
  },
  update(id, patch) {
    this.write(this.read().map((e) => (sameId(e.id, id) ? { ...e, ...patch } : e)));
  },
  remove(id) {
    this.write(this.read().filter((e) => !sameId(e.id, id)));
  },
};

// eventService sets err.status only when the backend answered. Then it refused
// on purpose (plan limit, date clash, validation) and the reason must be shown.
const serverAnswered = (err) => Boolean(err?.status);

export const fetchEvents = createAsyncThunk('events/fetch', async () => {
  try {
    const data = await eventService.getEvents();
    return { items: Array.isArray(data) ? data : [], offline: false };
  } catch {
    return { items: offline.read(), offline: true };
  }
});

// Approve / reject (Event Approval page)
export const updateEventStatus = createAsyncThunk(
  'events/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await eventService.updateEvent(id, { status });
      return { id, status, local: false };
    } catch (err) {
      if (serverAnswered(err)) return rejectWithValue({ message: err.message });
      offline.update(id, { status });
      return { id, status, local: true };
    }
  }
);

// Create or edit a tournament (Organizer Dashboard). Pass id to edit.
export const saveEvent = createAsyncThunk(
  'events/save',
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const event = id
        ? await eventService.updateEvent(id, payload)
        : await eventService.createEvent(payload);
      return { event, local: false };
    } catch (err) {
      if (serverAnswered(err)) return rejectWithValue({ message: err.message });
      if (id) {
        offline.update(id, payload);
        const existing = getState().events.items.find((e) => sameId(e.id, id));
        return { event: { ...existing, ...payload }, local: true };
      }
      const created = { ...payload, id: Date.now() };
      offline.add(created);
      return { event: created, local: true };
    }
  }
);

export const deleteEvent = createAsyncThunk('events/delete', async (id) => {
  try {
    await eventService.deleteEvent(id);
  } catch {
    offline.remove(id);
  }
  return id;
});

export const fetchMyRegistrations = createAsyncThunk(
  'events/fetchMyRegistrations',
  async (_, { getState }) => {
    try {
      const data = await eventService.getRegistrations(getState().auth.user.id);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  { condition: (_, { getState }) => Boolean(getState().auth.user?.id) }
);

export const registerForEvent = createAsyncThunk(
  'events/register',
  async ({ event, formData }, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    if (!user?.id) return rejectWithValue({ message: 'Please log in to register' });
    const payload = {
      eventId: Number(event.id),
      userId: Number(user.id),
      fullName: formData.fullName?.trim() || user.name || user.username,
      contactEmail: (formData.email || formData.contactEmail || user.email || '').trim(),
      phone: (formData.phone || '').trim(),
      inGameId: (formData.inGameId || '').trim(),
    };
    try {
      const created = await eventService.registerForEvent(payload);
      return { ...created, eventTitle: event.title };
    } catch (err) {
      return rejectWithValue({ message: err.message || 'Could not register. Please try again.' });
    }
  }
);

// Takes the event (what EventCard passes) and cancels the user's own registration for it
export const cancelRegistration = createAsyncThunk(
  'events/cancelRegistration',
  async (event, { getState }) => {
    const reg = getState().events.myRegistrations.find((r) => sameId(r.eventId, event.id));
    const regId = reg?.id || reg?.registrationId;
    try {
      if (regId) await eventService.cancelRegistration(regId);
    } catch { /* keep the previous behaviour: the registration is still removed locally */ }
    return { eventId: event.id };
  }
);

// Event Registrants page. On failure the reason is worked out here so the reducer stays pure.
export const fetchRegistrants = createAsyncThunk(
  'events/fetchRegistrants',
  async (eventId, { rejectWithValue }) => {
    try {
      const data = await eventService.getEventRegistrants(eventId);
      return { title: data.eventTitle || 'Tournament', list: data.registrants || [] };
    } catch (err) {
      const localEvent = offline.read().find((e) => sameId(e.id, eventId));
      let message = 'Could not load registrants.';
      if (err?.status === 404) message = localEvent ? 'No registrants yet' : 'Event not found';
      else if (err?.status === 401 || err?.status === 403) message = "You don't have access to this tournament's registrants";
      return rejectWithValue({ message, status: err?.status, title: localEvent?.title });
    }
  }
);

const changeAttendees = (state, eventId, delta) => {
  const ev = state.items.find((e) => sameId(e.id, eventId));
  if (!ev) return;
  const next = Math.max(0, Number(ev.attendees ?? ev.registered ?? 0) + delta);
  ev.attendees = next;
  ev.registered = next;
};

const emptyRegistrants = { title: 'Event', list: [], loading: true, error: null };

const initialState = {
  items: [],
  loading: true,
  loaded: false,
  offline: false,
  myRegistrations: [],
  registrants: emptyRegistrants,
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.items = action.payload.items;
        state.offline = action.payload.offline;
      })
      .addCase(updateEventStatus.fulfilled, (state, action) => {
        const ev = state.items.find((e) => sameId(e.id, action.payload.id));
        if (ev) ev.status = action.payload.status;
      })
      .addCase(saveEvent.fulfilled, (state, action) => {
        const { event } = action.payload;
        const index = state.items.findIndex((e) => sameId(e.id, event.id));
        if (index >= 0) state.items[index] = event;
        else state.items.unshift(event);
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => !sameId(e.id, action.payload));
      })
      .addCase(fetchMyRegistrations.fulfilled, (state, action) => {
        state.myRegistrations = action.payload;
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        state.myRegistrations.push(action.payload);
        changeAttendees(state, action.payload.eventId, 1);
      })
      .addCase(cancelRegistration.fulfilled, (state, action) => {
        state.myRegistrations = state.myRegistrations.filter((r) => !sameId(r.eventId, action.payload.eventId));
        changeAttendees(state, action.payload.eventId, -1);
      })
      .addCase(fetchRegistrants.pending, (state) => {
        state.registrants = { ...emptyRegistrants };
      })
      .addCase(fetchRegistrants.fulfilled, (state, action) => {
        state.registrants = { ...action.payload, loading: false, error: null };
      })
      .addCase(fetchRegistrants.rejected, (state, action) => {
        state.registrants = {
          title: action.payload?.title || 'Event',
          list: [],
          loading: false,
          error: action.payload?.message || 'Could not load registrants.',
        };
      })
      .addCase(logout, (state) => {
        state.myRegistrations = [];
        state.registrants = emptyRegistrants;
      });
  },
});

export const selectEvents = (state) => state.events.items;
export const selectEventsLoading = (state) => state.events.loading;
export const selectEventsLoaded = (state) => state.events.loaded;
export const selectMyRegistrations = (state) => state.events.myRegistrations;
export const selectRegistrants = (state) => state.events.registrants;

// Approved (or status-less) events, newest list order kept
export const selectApprovedEvents = createSelector([selectEvents], (items) =>
  items.filter((e) => !e.status || e.status === EVENT_STATUSES.APPROVED)
);

// Event ids the user is registered for, as a Set for quick lookups
export const selectRegisteredEventIds = createSelector([selectMyRegistrations], (regs) =>
  new Set(regs.map((r) => String(r.eventId)))
);

// Approval page buckets
export const selectEventsByStatus = createSelector([selectEvents], (items) => ({
  pending: items.filter((e) => e.status === EVENT_STATUSES.PENDING),
  approved: items.filter((e) => e.status === EVENT_STATUSES.APPROVED),
  rejected: items.filter((e) => e.status === EVENT_STATUSES.REJECTED),
}));

export default eventsSlice.reducer;
