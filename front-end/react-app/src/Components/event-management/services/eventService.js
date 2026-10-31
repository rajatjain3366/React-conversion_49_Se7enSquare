// Centralized API service for Event Management with automated x-role and x-user-id injection.
import { API_BASE, getRole, getCurrentUser, EVENT_STATUSES } from '../utils/constants';

function getHeaders(custom = {}) {
  const user = getCurrentUser();
  return {
    'Content-Type': 'application/json',
    'x-role': getRole(),
    ...(user?.id !== undefined && user?.id !== null ? { 'x-user-id': String(user.id) } : {}),
    ...custom,
  };
}

export const eventService = {
  async getEvents(headers = {}) {
    const res = await fetch(`${API_BASE}/events`, {
      headers: getHeaders(headers),
    });
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.statusText}`);
    return res.json();
  },

  async getEventById(id, headers = {}) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      headers: getHeaders(headers),
    });
    if (!res.ok) throw new Error(`Failed to fetch event #${id}`);
    return res.json();
  },

  async createEvent(payload, headers = {}) {
    const role = headers['x-role'] || getRole();
    const safePayload = { ...payload };
    if (role === 'organizer' && safePayload.status === EVENT_STATUSES.APPROVED) {
      safePayload.status = EVENT_STATUSES.PENDING;
    }
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: getHeaders(headers),
      body: JSON.stringify(safePayload),
    });
    if (!res.ok) {
      // Keep the backend's message (e.g. the free-plan tournament limit) and
      // the HTTP status, so the page can show the real reason.
      const data = await res.json().catch(() => ({}));
      const msg = data.message || `Failed to create event (HTTP ${res.status})`;
      const err = new Error(Array.isArray(msg) ? msg.join(', ') : msg);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  async updateEvent(id, payload, headers = {}) {
    const role = headers['x-role'] || getRole();
    const safePayload = { ...payload };
    if (role === 'organizer' && safePayload.status === EVENT_STATUSES.APPROVED) {
      delete safePayload.status;
    }
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PATCH',
      headers: getHeaders(headers),
      body: JSON.stringify(safePayload),
    });
    if (!res.ok) {
      // Same as createEvent: pass on the backend's message and status.
      const data = await res.json().catch(() => ({}));
      const msg = data.message || `Failed to update event (HTTP ${res.status})`;
      const err = new Error(Array.isArray(msg) ? msg.join(', ') : msg);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  async deleteEvent(id, headers = {}) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders(headers),
    });
    if (!res.ok) throw new Error(`Failed to delete event: ${res.statusText}`);
    return res.json();
  },

  async getCommunities(headers = {}) {
    const res = await fetch(`${API_BASE}/communities`, {
      headers: getHeaders(headers),
    });
    if (!res.ok) throw new Error(`Failed to fetch communities`);
    return res.json();
  },

  async getRegistrations(userIdOrHeaders = null, customHeaders = {}) {
    let url = `${API_BASE}/event-registrations`;
    let headers = customHeaders;
    if (typeof userIdOrHeaders === 'number' || typeof userIdOrHeaders === 'string') {
      url += `?userId=${userIdOrHeaders}`;
    } else if (userIdOrHeaders && typeof userIdOrHeaders === 'object') {
      headers = userIdOrHeaders;
    }
    const res = await fetch(url, {
      headers: getHeaders(headers),
    });
    if (!res.ok) throw new Error(`Failed to fetch event registrations`);
    return res.json();
  },

  async registerForEvent(payload, headers = {}) {
    const res = await fetch(`${API_BASE}/event-registrations`, {
      method: 'POST',
      headers: getHeaders(headers),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.message || `Failed to register for event (HTTP ${res.status})`;
      const err = new Error(Array.isArray(msg) ? msg.join(', ') : msg);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  async cancelRegistration(id, headers = {}) {
    const res = await fetch(`${API_BASE}/event-registrations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(headers),
    });
    if (!res.ok) throw new Error(`Failed to cancel registration #${id}`);
    return res.json();
  },

  async getEventRegistrants(eventId, headers = {}) {
    const res = await fetch(`${API_BASE}/events/${eventId}/registrants`, {
      headers: getHeaders(headers),
    });
    if (!res.ok) {
      const err = new Error(`Failed to fetch registrants for event #${eventId}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  async upgradeOrganizerPlan(userId, plan = 'premium', headers = {}) {
    const res = await fetch(`${API_BASE}/organisers/subscription/upgrade`, {
      method: 'POST',
      headers: getHeaders(headers),
      body: JSON.stringify({ userId: Number(userId), plan }),
    });
    if (!res.ok) throw new Error(`Failed to upgrade organizer plan`);
    return res.json();
  },
};
