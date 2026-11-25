import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { eventService } from '../../Components/event-management/services/eventService';
import { EVENT_STATUSES } from '../../Components/event-management/utils/constants';
import { logout } from './authSlice';

/**
 * Events slice — Component (Event Management).
 *
 * Implements strict Redux Toolkit architecture:
 * 1. 1:1 repository mapping to backend events and event-registrations
 * 2. 4-CRUD operations: Create (createEvent, saveEvent), Read (fetchEvents, fetchEventById, fetchMyRegistrations, fetchRegistrants), Update (updateEvent, updateEventStatus), Delete (deleteEvent)
 * 3. Strict DB-First Thunk lifecycle: state mutated in .fulfilled only
 * 4. Zero localStorage domain fallbacks
 * 5. All form, filter, and modal state in Redux
 * 6. SWR cache window of 60 seconds (LIST_CACHE_MS)
 * 7. Unmount cleanup actions
 */

const LIST_CACHE_MS = 60_000;

const sameId = (a, b) => Number(a) === Number(b) || String(a) === String(b);

// [CRUD: READ ALL] with SWR cache
export const fetchEvents = createAsyncThunk(
  'events/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const data = await eventService.getEvents();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Failed to fetch events' });
    }
  },
  {
    condition: (force = false, { getState }) => {
      if (force) return true;
      const { items, fetching, lastFetched } = getState().events;
      if (fetching) return false;
      const isFresh = lastFetched && Date.now() - lastFetched < LIST_CACHE_MS;
      if (items.length > 0 && isFresh) return false;
      return true;
    },
  }
);

// [CRUD: READ ONE]
export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await eventService.getEventById(id);
      return data;
    } catch (err) {
      return rejectWithValue({ message: err?.message || `Failed to fetch event #${id}` });
    }
  }
);

// [CRUD: CREATE]
export const createEvent = createAsyncThunk(
  'events/create',
  async (payload, { rejectWithValue }) => {
    try {
      const created = await eventService.createEvent(payload);
      return created;
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Failed to create event' });
    }
  }
);

// [CRUD: UPDATE]
export const updateEvent = createAsyncThunk(
  'events/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const updated = await eventService.updateEvent(id, payload);
      return updated;
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Failed to update event' });
    }
  }
);

// Approve / reject status update (Event Approval page)
export const updateEventStatus = createAsyncThunk(
  'events/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await eventService.updateEvent(id, { status });
      return { id, status };
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Failed to update event status' });
    }
  }
);

// Create or edit a tournament (Organizer Dashboard). Pass id to edit.
export const saveEvent = createAsyncThunk(
  'events/save',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const event = id
        ? await eventService.updateEvent(id, payload)
        : await eventService.createEvent(payload);
      return { event };
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Failed to save event' });
    }
  }
);

// [CRUD: DELETE]
export const deleteEvent = createAsyncThunk(
  'events/delete',
  async (id, { rejectWithValue }) => {
    try {
      await eventService.deleteEvent(id);
      return id;
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Failed to delete event' });
    }
  }
);

export const fetchMyRegistrations = createAsyncThunk(
  'events/fetchMyRegistrations',
  async (_, { getState, rejectWithValue }) => {
    try {
      const data = await eventService.getRegistrations(getState().auth.user.id);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Failed to fetch registrations' });
    }
  },
  { condition: (_, { getState }) => Boolean(getState().auth.user?.id) }
);

export const registerForEvent = createAsyncThunk(
  'events/register',
  async ({ event, formData = {} }, { getState, rejectWithValue }) => {
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

// Takes the event or id and cancels the user's own registration for it
export const cancelRegistration = createAsyncThunk(
  'events/cancelRegistration',
  async (arg, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    if (!user?.id) {
      return rejectWithValue({ message: 'Please log in to manage registrations.' });
    }

    const myRegistrations = getState().events.myRegistrations || [];

    // Determine target eventId and registrationId
    let eventId = null;
    let regId = null;

    if (arg && typeof arg === 'object') {
      if (arg.eventId !== undefined) {
        eventId = arg.eventId;
        regId = arg.id || arg.registrationId;
      } else if (arg.id !== undefined) {
        eventId = arg.id;
      }
    } else if (typeof arg === 'number' || typeof arg === 'string') {
      const matchByEvent = myRegistrations.find((r) => sameId(r.eventId, arg));
      if (matchByEvent) {
        eventId = matchByEvent.eventId;
        regId = matchByEvent.id || matchByEvent.registrationId;
      } else {
        const matchByReg = myRegistrations.find((r) => sameId(r.id, arg));
        if (matchByReg) {
          eventId = matchByReg.eventId;
          regId = matchByReg.id;
        } else {
          eventId = arg;
        }
      }
    }

    if (!regId && eventId !== null && eventId !== undefined) {
      const reg = myRegistrations.find(
        (r) => sameId(r.eventId, eventId) && (!r.userId || sameId(r.userId, user.id))
      );
      regId = reg?.id || reg?.registrationId;
    }

    if (!regId) {
      return rejectWithValue({
        message: 'No active registration found for this event.',
      });
    }

    try {
      await eventService.cancelRegistration(regId);
      return { eventId, registrationId: regId };
    } catch (err) {
      return rejectWithValue({
        message: err.message || 'Could not cancel registration.',
      });
    }
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
      let message = 'Could not load registrants.';
      if (err?.status === 404) message = 'Event not found';
      else if (err?.status === 401 || err?.status === 403) message = "You don't have access to this tournament's registrants";
      return rejectWithValue({ message, status: err?.status });
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

export const initialCreateEventForm = {
  title: '',
  description: '',
  date: '',
  time: '',
  category: 'Tournament',
  communityId: '',
  maxAttendees: 100,
  entryFee: 0,
  prizePool: 0,
  status: 'pending',
};

export const initialRegistrationForm = {
  fullName: '',
  email: '',
  phone: '',
  inGameId: '',
};

const initialState = {
  items: [],
  currentEvent: null,
  loading: true,
  fetching: false,
  loaded: false,
  error: null,
  lastFetched: null,
  myRegistrations: [],
  registrants: emptyRegistrants,
  // Filters
  categoryFilter: 'all',
  statusFilter: 'all',
  searchQuery: '',
  // Create / Edit Tournament Form
  createForm: { ...initialCreateEventForm },
  createFormSubmitting: false,
  createFormError: null,
  // Registration Form
  registrationForm: { ...initialRegistrationForm },
  registrationSubmitting: false,
  registrationError: null,
  // Modal & Approval UI State
  modalOpen: false,
  modalMode: 'create',
  selectedEventId: null,
  approvalModal: {
    open: false,
    event: null,
    action: null,
  },
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    // Filter reducers
    setCategoryFilter(state, action) {
      state.categoryFilter = action.payload;
    },
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    resetEventsFilter(state) {
      state.categoryFilter = 'all';
      state.statusFilter = 'all';
      state.searchQuery = '';
    },
    // Create form reducers
    setCreateFormField(state, action) {
      const { field, value } = action.payload;
      state.createForm[field] = value;
    },
    setCreateForm(state, action) {
      state.createForm = { ...state.createForm, ...action.payload };
    },
    resetCreateForm(state) {
      state.createForm = { ...initialCreateEventForm };
      state.createFormSubmitting = false;
      state.createFormError = null;
    },
    // Registration form reducers
    setRegistrationFormField(state, action) {
      const { field, value } = action.payload;
      state.registrationForm[field] = value;
    },
    setRegistrationForm(state, action) {
      state.registrationForm = { ...state.registrationForm, ...action.payload };
    },
    resetRegistrationForm(state) {
      state.registrationForm = { ...initialRegistrationForm };
      state.registrationSubmitting = false;
      state.registrationError = null;
    },
    // Modal management
    openModal(state, action) {
      state.modalOpen = true;
      if (action.payload) {
        state.modalMode = action.payload.mode || 'create';
        if (action.payload.event) {
          state.selectedEventId = action.payload.event.id;
          state.currentEvent = action.payload.event;
          state.createForm = { ...initialCreateEventForm, ...action.payload.event };
        }
      }
    },
    closeModal(state) {
      state.modalOpen = false;
      state.selectedEventId = null;
      state.currentEvent = null;
    },
    // Approval modal
    openApprovalModal(state, action) {
      state.approvalModal = {
        open: true,
        event: action.payload.event,
        action: action.payload.action || 'approve',
      };
    },
    closeApprovalModal(state) {
      state.approvalModal = {
        open: false,
        event: null,
        action: null,
      };
    },
    clearCurrentEvent(state) {
      state.currentEvent = null;
      state.selectedEventId = null;
    },
    resetEventsState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchEvents
      .addCase(fetchEvents.pending, (state) => {
        state.fetching = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.fetching = false;
        state.loading = false;
        state.loaded = true;
        state.items = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.fetching = false;
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Failed to fetch events';
      })
      // fetchEventById
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.currentEvent = action.payload;
      })
      // createEvent
      .addCase(createEvent.pending, (state) => {
        state.createFormSubmitting = true;
        state.createFormError = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.createFormSubmitting = false;
        state.items.unshift(action.payload);
        state.modalOpen = false;
        state.createForm = { ...initialCreateEventForm };
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.createFormSubmitting = false;
        state.createFormError = action.payload?.message || 'Failed to create event';
      })
      // updateEvent
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.items.findIndex((e) => sameId(e.id, action.payload.id));
        if (index >= 0) state.items[index] = action.payload;
        if (state.currentEvent && sameId(state.currentEvent.id, action.payload.id)) {
          state.currentEvent = action.payload;
        }
      })
      // updateEventStatus
      .addCase(updateEventStatus.fulfilled, (state, action) => {
        const ev = state.items.find((e) => sameId(e.id, action.payload.id));
        if (ev) ev.status = action.payload.status;
        if (state.currentEvent && sameId(state.currentEvent.id, action.payload.id)) {
          state.currentEvent.status = action.payload.status;
        }
        state.approvalModal = { open: false, event: null, action: null };
      })
      // saveEvent
      .addCase(saveEvent.pending, (state) => {
        state.createFormSubmitting = true;
        state.createFormError = null;
      })
      .addCase(saveEvent.fulfilled, (state, action) => {
        state.createFormSubmitting = false;
        const { event } = action.payload;
        const index = state.items.findIndex((e) => sameId(e.id, event.id));
        if (index >= 0) state.items[index] = event;
        else state.items.unshift(event);
        state.modalOpen = false;
        state.createForm = { ...initialCreateEventForm };
      })
      .addCase(saveEvent.rejected, (state, action) => {
        state.createFormSubmitting = false;
        state.createFormError = action.payload?.message || 'Failed to save event';
      })
      // deleteEvent
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => !sameId(e.id, action.payload));
      })
      // fetchMyRegistrations
      .addCase(fetchMyRegistrations.fulfilled, (state, action) => {
        state.myRegistrations = action.payload;
      })
      // registerForEvent
      .addCase(registerForEvent.pending, (state) => {
        state.registrationSubmitting = true;
        state.registrationError = null;
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        state.registrationSubmitting = false;
        const exists = state.myRegistrations.some(
          (r) => sameId(r.id, action.payload.id) || sameId(r.eventId, action.payload.eventId)
        );
        if (!exists) {
          state.myRegistrations.push(action.payload);
          changeAttendees(state, action.payload.eventId, 1);
        }
        state.modalOpen = false;
        state.registrationForm = { ...initialRegistrationForm };
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.registrationSubmitting = false;
        state.registrationError = action.payload?.message || 'Could not register.';
      })
      // cancelRegistration
      .addCase(cancelRegistration.fulfilled, (state, action) => {
        const { eventId, registrationId } = action.payload;
        state.myRegistrations = state.myRegistrations.filter(
          (r) =>
            (!eventId || !sameId(r.eventId, eventId)) &&
            (!registrationId || !sameId(r.id, registrationId))
        );
        if (eventId !== null && eventId !== undefined) {
          changeAttendees(state, eventId, -1);
        }
      })
      // fetchRegistrants
      .addCase(fetchRegistrants.pending, (state) => {
        state.registrants = { ...emptyRegistrants };
      })
      .addCase(fetchRegistrants.fulfilled, (state, action) => {
        state.registrants = { ...action.payload, loading: false, error: null };
      })
      .addCase(fetchRegistrants.rejected, (state, action) => {
        state.registrants = {
          title: 'Event',
          list: [],
          loading: false,
          error: action.payload?.message || 'Could not load registrants.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setCategoryFilter,
  setStatusFilter,
  setSearchQuery,
  resetEventsFilter,
  setCreateFormField,
  setCreateForm,
  resetCreateForm,
  setRegistrationFormField,
  setRegistrationForm,
  resetRegistrationForm,
  openModal,
  closeModal,
  openApprovalModal,
  closeApprovalModal,
  clearCurrentEvent,
  resetEventsState,
} = eventsSlice.actions;

export const selectEvents = (state) => state.events.items;
export const selectCurrentEvent = (state) => state.events.currentEvent;
export const selectEventsLoading = (state) => state.events.loading;
export const selectEventsLoaded = (state) => state.events.loaded;
export const selectEventsError = (state) => state.events.error;
export const selectCategoryFilter = (state) => state.events.categoryFilter;
export const selectStatusFilter = (state) => state.events.statusFilter;
export const selectSearchQuery = (state) => state.events.searchQuery;
export const selectCreateEventForm = (state) => state.events.createForm;
export const selectRegistrationForm = (state) => state.events.registrationForm;
export const selectEventModalState = (state) => ({
  isOpen: state.events.modalOpen,
  mode: state.events.modalMode,
  selectedId: state.events.selectedEventId,
});
export const selectApprovalModalState = (state) => state.events.approvalModal;
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
