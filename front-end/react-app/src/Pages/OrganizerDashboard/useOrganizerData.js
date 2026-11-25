// Custom hook connecting the Organizer Dashboard to the Redux events, organizer and communities slices.
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useToast } from '../../Components/event-management/hooks/useToast';
import { EVENT_STATUSES } from '../../Components/event-management/utils/constants';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { fetchCommunityList, selectAllCommunities } from '../../store/slices/communitiesSlice';
import {
  fetchEvents,
  saveEvent,
  deleteEvent,
  openModal,
  closeModal,
  setCreateForm,
  resetCreateForm,
  selectEventsLoading,
  selectCreateEventForm,
  selectEventModalState,
} from '../../store/slices/eventsSlice';
import {
  fetchOrganizerData,
  upgradeOrganizerPlan,
  promoteEvent,
  orgFilterChanged,
  resetOrganizerState,
  selectOrganizer,
  selectOrganizerFilter,
  selectMyEvents,
} from '../../store/slices/organizerSlice';
import {
  selectOrganizerFilteredEvents,
  selectOrganizerStats,
} from '../../store/selectors/eventSelectors';

const emptyForm = (communityId = '') => ({
  title: '',
  description: '',
  communityId,
  date: new Date().toISOString().slice(0, 10),
  time: '6:00 PM',
  maxAttendees: 100,
  entryFee: 0,
  prizePool: 0,
  status: EVENT_STATUSES.PENDING,
});

export function useOrganizerData() {
  const dispatch = useAppDispatch();
  const sessionUser = useAppSelector(selectCurrentUser);
  const currentUser = sessionUser
    ? { ...sessionUser, name: sessionUser.name || sessionUser.firstName || sessionUser.username }
    : null;
  const allCommunities = useAppSelector(selectAllCommunities);
  const myEvents = useAppSelector(selectMyEvents);
  const eventsLoading = useAppSelector(selectEventsLoading);
  const { profile: organizerProfile, earnings, regCountByEvent, loading: organizerLoading } = useAppSelector(selectOrganizer);
  const loading = eventsLoading || organizerLoading;

  // Filter from Redux
  const currentFilter = useAppSelector(selectOrganizerFilter);
  const setCurrentFilter = useCallback((filter) => dispatch(orgFilterChanged(filter)), [dispatch]);

  // Modal and Form State from Redux
  const modalState = useAppSelector(selectEventModalState);
  const modalOpen = modalState.isOpen;
  const modalMode = modalState.mode;
  const editEventId = modalState.selectedId;
  const formData = useAppSelector(selectCreateEventForm);

  const setModalOpen = useCallback((open) => {
    if (!open) dispatch(closeModal());
  }, [dispatch]);

  const setFormData = useCallback((data) => {
    dispatch(setCreateForm(data));
  }, [dispatch]);

  const { showToast } = useToast();

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchCommunityList());
    dispatch(fetchOrganizerData());
  }, [dispatch, sessionUser?.id]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      dispatch(resetOrganizerState());
      dispatch(resetCreateForm());
      dispatch(closeModal());
    };
  }, [dispatch]);

  const handleUpgradePlan = async () => {
    try {
      await dispatch(upgradeOrganizerPlan()).unwrap();
      showToast('🏆 Upgraded to Premium Organizer!');
    } catch {
      showToast('⚠️ Could not upgrade plan');
    }
  };

  const handlePromoteEvent = async (eventId) => {
    try {
      await dispatch(promoteEvent(eventId)).unwrap();
      showToast('📣 Promoted to the Discover carousel for 7 days');
    } catch {
      showToast('⚠️ Could not promote event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this tournament? This cannot be undone.')) return;
    await dispatch(deleteEvent(id));
    showToast('🗑️ Tournament deleted');
  };

  const openCreateModal = () => {
    if (allCommunities.length === 0) {
      showToast('⚠️ No communities available — join or create one first');
      return;
    }
    dispatch(openModal({
      mode: 'create',
      event: emptyForm(String(allCommunities[0]?.id || '')),
    }));
  };

  const openEditModal = (event) => {
    dispatch(openModal({
      mode: 'edit',
      event: {
        id: event.id,
        title: event.title || '',
        description: event.description || '',
        communityId: String(event.communityId || allCommunities[0]?.id || ''),
        date: event.date || '',
        time: event.time || '6:00 PM',
        maxAttendees: event.maxAttendees || 100,
        entryFee: event.entryFee || 0,
        prizePool: event.prizePool || 0,
        status: event.status || EVENT_STATUSES.PENDING,
      },
    }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim() || formData.title.length < 3) {
      showToast('⚠️ Title must be at least 3 characters');
      return;
    }
    if (!formData.description?.trim() || formData.description.length < 10) {
      showToast('⚠️ Description must be at least 10 characters');
      return;
    }
    if (!formData.communityId) {
      showToast('⚠️ Select a community');
      return;
    }
    if (!formData.date) {
      showToast('⚠️ Select a date');
      return;
    }

    let finalStatus = formData.status;
    if (modalMode === 'create') {
      finalStatus = EVENT_STATUSES.PENDING;
    } else if (modalMode === 'edit') {
      const existing = myEvents.find((event) => event.id === editEventId);
      const existingStatus = existing?.status || EVENT_STATUSES.PENDING;
      if (currentUser?.role === 'organizer') {
        finalStatus = formData.status === EVENT_STATUSES.CANCELLED ? EVENT_STATUSES.CANCELLED : existingStatus;
      }
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      communityId: Number(formData.communityId),
      date: formData.date,
      time: formData.time || '6:00 PM',
      maxAttendees: Number(formData.maxAttendees) || 100,
      entryFee: Number(formData.entryFee) || 0,
      prizePool: Number(formData.prizePool) || 0,
      ...(formData.category ? { category: formData.category } : {}),
      status: finalStatus,
      type: 'tournament',
      createdBy: currentUser?.username || currentUser?.name || 'organizer',
      ...(currentUser?.id ? { organiserId: Number(currentUser.id) } : {}),
    };

    try {
      await dispatch(saveEvent({
        id: modalMode === 'edit' ? editEventId : undefined,
        payload,
      })).unwrap();
      const verb = modalMode === 'create' ? '🏆 Tournament created' : '✅ Tournament updated';
      showToast(verb);
      dispatch(closeModal());
      dispatch(resetCreateForm());
    } catch (err) {
      showToast(`⚠️ ${err.message || 'Operation failed'}`);
    }
  };

  const stats = useAppSelector(selectOrganizerStats);
  const filteredEvents = useAppSelector(selectOrganizerFilteredEvents);

  const totalCount = stats.totalTournaments;
  const pendingCount = stats.pendingApproval;
  const upcomingCount = stats.upcomingApproved;
  const totalRegistrations = stats.totalRegistrations;

  const isPremium = organizerProfile?.plan === 'premium';

  return {
    currentUser,
    allCommunities,
    regCountByEvent,
    currentFilter,
    setCurrentFilter,
    organizerProfile,
    earnings,
    loading,
    modalOpen,
    setModalOpen,
    modalMode,
    formData,
    setFormData,
    handleUpgradePlan,
    handlePromoteEvent,
    handleDeleteEvent,
    openCreateModal,
    openEditModal,
    handleModalSubmit,
    totalCount,
    pendingCount,
    upcomingCount,
    totalRegistrations,
    filteredEvents,
    isPremium,
  };
}
