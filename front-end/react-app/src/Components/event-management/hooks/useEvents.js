// Custom hook reading events from the Redux events slice, with a page-level category filter.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEvents,
  deleteEvent as deleteEventThunk,
  selectEvents,
  selectEventsLoading,
  selectApprovedEvents,
} from '../../../store/slices/eventsSlice';

export function useEvents(initialCategory = 'all') {
  const dispatch = useDispatch();
  const events = useSelector(selectEvents);
  const loading = useSelector(selectEventsLoading);
  const approvedEvents = useSelector(selectApprovedEvents);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const loadEvents = useCallback(() => dispatch(fetchEvents()), [dispatch]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Approved upcoming events filtered by the selected category
  const upcomingEvents = useMemo(() => {
    if (selectedCategory === 'all') return approvedEvents;
    const cat = selectedCategory.toLowerCase();
    return approvedEvents.filter(
      (e) => e.category?.toLowerCase() === cat || e.type?.toLowerCase() === cat
    );
  }, [approvedEvents, selectedCategory]);

  const deleteEvent = useCallback((id) => dispatch(deleteEventThunk(id)).unwrap(), [dispatch]);

  return {
    events,
    loading,
    selectedCategory,
    setSelectedCategory,
    upcomingEvents,
    loadEvents,
    deleteEvent,
  };
}
