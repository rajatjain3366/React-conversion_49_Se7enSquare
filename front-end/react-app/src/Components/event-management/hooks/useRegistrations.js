// Custom hook for the user's event registrations, backed by the Redux events slice.
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyRegistrations,
  registerForEvent as registerThunk,
  cancelRegistration as cancelThunk,
  selectMyRegistrations,
  selectRegisteredEventIds,
} from '../../../store/slices/eventsSlice';

export function useRegistrations() {
  const dispatch = useDispatch();
  const myRegistrations = useSelector(selectMyRegistrations);
  const registeredIds = useSelector(selectRegisteredEventIds);

  const loadRegistrations = useCallback(() => dispatch(fetchMyRegistrations()), [dispatch]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const isRegistered = useCallback((eventId) => registeredIds.has(String(eventId)), [registeredIds]);

  // The slice also raises the event's attendee count
  const registerForEvent = useCallback(async (event, formData) => {
    try {
      const registration = await dispatch(registerThunk({ event, formData })).unwrap();
      return { success: true, registration };
    } catch (err) {
      return { success: false, error: err.message || 'Could not register. Please try again.' };
    }
  }, [dispatch]);

  // Pass the event; the slice finds the user's own registration for it
  const cancelRegistration = useCallback(async (event) => {
    await dispatch(cancelThunk(event));
    return { success: true };
  }, [dispatch]);

  return {
    myRegistrations,
    loadRegistrations,
    isRegistered,
    registerForEvent,
    cancelRegistration,
  };
}
