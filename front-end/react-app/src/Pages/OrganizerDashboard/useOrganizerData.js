// Custom hook connecting the Organizer Dashboard to the Redux events, organizer and communities slices.
// The tournament form in the modal is page-only UI, so it stays in local state.
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '../../Components/event-management/hooks/useToast';
import { EVENT_STATUSES } from '../../Components/event-management/utils/constants';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { fetchCommunityList, selectAllCommunities } from '../../store/slices/communitiesSlice';
import { fetchEvents, saveEvent, deleteEvent, selectEventsLoading } from '../../store/slices/eventsSlice';
import {
  fetchOrganizerData,
  upgradeOrganizerPlan,
  promoteEvent,
  selectOrganizer,
  selectMyEvents,
} from '../../store/slices/organizerSlice';

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
  const dispatch = useDispatch();
  const sessionUser = useSelector(selectCurrentUser);
  const currentUser = sessionUser
    ? { ...sessionUser, name: sessionUser.name || sessionUser.firstName || sessionUser.username }
    : null;
  const allCommunities = useSelector(selectAllCommunities);
  const myEvents = useSelector(selectMyEvents);
  const eventsLoading = useSelector(selectEventsLoading);
  const { profile: organizerProfile, earnings, regCountByEvent, loading: organizerLoading } = useSelector(selectOrganizer);
  const loading = eventsLoading || organizerLoading;

  const [currentFilter, setCurrentFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editEventId, setEditEventId] = useState(null);
  const [formData, setFormData] = useState(() => ({ ...emptyForm(), date: '' }));

  const { showToast } = useToast();

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchCommunityList());
    dispatch(fetchOrganizerData());
  }, [dispatch, sessionUser?.id]);

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
    setModalMode('create');
    setEditEventId(null);
    setFormData(emptyForm(String(allCommunities[0]?.id || '')));
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    setModalMode('edit');
    setEditEventId(event.id);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      communityId: String(event.communityId || allCommunities[0]?.id || ''),
      date: event.date || '',
      time: event.time || '6:00 PM',
      maxAttendees: event.maxAttendees || 100,
      entryFee: event.entryFee || 0,
      prizePool: event.prizePool || 0,
      status: event.status || EVENT_STATUSES.PENDING,
    });
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.title.length < 3) {
      showToast('⚠️ Title must be at least 3 characters');
      return;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
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
      ...formData,
      status: finalStatus,
      communityId: Number(formData.communityId),
      maxAttendees: Number(formData.maxAttendees) || 100,
      entryFee: Number(formData.entryFee) || 0,
      prizePool: Number(formData.prizePool) || 0,
      type: 'tournament',
      createdBy: currentUser?.username || currentUser?.name || 'organizer',
      // Backend DTO only accepts "organiserId" (UK spelling). Sending the US
      // spelling "organizerId" too made the ValidationPipe reject every
      // create/edit with 400 (forbidNonWhitelisted).
      organiserId: currentUser?.id,
    };

    try {
      const { local } = await dispatch(saveEvent({
        id: modalMode === 'edit' ? editEventId : undefined,
        payload,
      })).unwrap();
      const verb = modalMode === 'create' ? '🏆 Tournament created' : '✅ Tournament updated';
      showToast(local ? `${verb} (locally)` : verb);
    } catch (err) {
      // The backend refused on purpose (plan limit, date clash, validation):
      // show the real reason and keep the modal open.
      showToast(`⚠️ ${err.message}`);
      return;
    }

    setModalOpen(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const totalCount = myEvents.length;
  const pendingCount = myEvents.filter((e) => e.status === EVENT_STATUSES.PENDING).length;
  const upcomingCount = myEvents.filter(
    (e) => e.status === EVENT_STATUSES.APPROVED && e.date >= today
  ).length;
  const totalRegistrations = myEvents.reduce((sum, e) => {
    const isOfflineOnly = Number(e.id) > 1000000000 || String(e.id).length > 10;
    if (isOfflineOnly) return sum;
    const count = regCountByEvent[e.id] ?? e.attendees ?? 0;
    return sum + count;
  }, 0);

  const filteredEvents = (
    currentFilter === 'all'
      ? myEvents
      : myEvents.filter((e) => e.status === currentFilter)
  ).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

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
