// Custom hook for managing event state, category filters, API queries, offline fallback, and drafts.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { eventService } from '../services/eventService';
import { STORAGE_KEYS, getCurrentUser, EVENT_STATUSES } from '../utils/constants';

export function useEvents(initialCategory = 'all') {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    let loadedEvents = [];

    try {
      loadedEvents = await eventService.getEvents();
    } catch {
      // Offline fallback: load from localStorage
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
          loadedEvents = stored;
        }
      } catch {
        loadedEvents = [];
      }
    }

    setEvents(Array.isArray(loadedEvents) ? loadedEvents : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Derived approved upcoming events filtered by selected category
  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => !e.status || e.status === EVENT_STATUSES.APPROVED)
      .filter((e) => {
        if (selectedCategory === 'all') return true;
        return (
          (e.category && e.category.toLowerCase() === selectedCategory.toLowerCase()) ||
          (e.type && e.type.toLowerCase() === selectedCategory.toLowerCase())
        );
      });
  }, [events, selectedCategory]);

  const submitEvent = useCallback(async (payload) => {
    const user = getCurrentUser();
    const finalPayload = {
      ...payload,
      organizerId: user?.id,
      createdBy: user?.name || user?.username || 'Organizer',
      status: EVENT_STATUSES.PENDING,
    };

    try {
      const created = await eventService.createEvent(finalPayload);
      setEvents((prev) => [created, ...prev]);
      return { success: true, event: created, isLocal: false };
    } catch {
      // Offline fallback
      const localId = Date.now();
      const localCreated = { ...finalPayload, id: localId };
      setEvents((prev) => [localCreated, ...prev]);

      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
        stored.push(localCreated);
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(stored));
      } catch {
        // ignore storage errors
      }

      return { success: true, event: localCreated, isLocal: true };
    }
  }, []);

  const deleteEvent = useCallback(async (id) => {
    try {
      await eventService.deleteEvent(id);
    } catch {
      // offline fallback: update localStorage
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
        const updated = stored.filter(
          (e) => Number(e.id) !== Number(id) && String(e.id) !== String(id)
        );
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    setEvents((prev) =>
      prev.filter((e) => Number(e.id) !== Number(id) && String(e.id) !== String(id))
    );
  }, []);

  const updateAttendeeCount = useCallback((eventId, delta) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (Number(e.id) === Number(eventId) || String(e.id) === String(eventId)) {
          const current = Number(e.attendees ?? e.registered ?? 0);
          const next = Math.max(0, current + delta);
          return { ...e, attendees: next, registered: next };
        }
        return e;
      })
    );
  }, []);

  // Draft management
  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEYS.DRAFT);
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  }, []);

  const saveDraft = useCallback((draftData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draftData));
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.DRAFT);
    } catch {
      // ignore
    }
  }, []);

  return {
    events,
    setEvents,
    loading,
    selectedCategory,
    setSelectedCategory,
    upcomingEvents,
    loadEvents,
    submitEvent,
    deleteEvent,
    updateAttendeeCount,
    loadDraft,
    saveDraft,
    clearDraft,
  };
}
