// Central constants, storage keys, categories, and user helpers for Event Management.
// Use the same API base as the rest of the app (services/api.js):
// VITE_API_URL if set, otherwise "/api", which the Vite dev server proxies to
// the backend on port 3000. It was hardcoded to http://localhost:3000/api,
// which ignored the proxy/env and broke on any other host or port.
export { API_BASE } from '../../../services/api';

export const STORAGE_KEYS = {
  EVENTS: 'events',
  DRAFT: 'nexus_event_draft',
  USER: 'nexus_user',
  CURRENT_USER: 'currentUser',
  TOKEN: 'token',
};

export const CATEGORIES = [
  'Tournament',
  'Casual Play',
  'Competitive',
  'Workshop',
  'Community Night',
];

export const EVENT_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

export const DEFAULT_COMMUNITIES = [];

export function getCurrentUser() {
  try {
    const raw =
      localStorage.getItem('nexus_user') ||
      localStorage.getItem('currentUser');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && (u.id || u.username || u.name)) {
        return {
          id: u.id,
          name: u.name || u.firstName || u.username || 'User',
          username: u.username || u.name || 'User',
          role: u.role || 'user',
          email: u.email || '',
        };
      }
    }
    const t = localStorage.getItem('token');
    if (t) {
      const p = JSON.parse(atob(t.split('.')[1]));
      return {
        id: p.sub || p.id,
        name: p.name || p.username || 'User',
        username: p.username || p.name || 'User',
        role: p.role || 'user',
        email: p.email || '',
      };
    }
  } catch {
    // ignore parse error and return null
  }
  return null;
}

export function getRole() {
  const user = getCurrentUser();
  return user?.role || 'user';
}
