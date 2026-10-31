// Custom hook managing organizer tournament state, stats calculations, API requests, and modal operations.
import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../../Components/event-management/services/eventService';
import { useToast } from '../../Components/event-management/hooks/useToast';
import { useLocalStorageFallback } from '../../Components/event-management/hooks/useLocalStorageFallback';
import {
  API_BASE,
  STORAGE_KEYS,
  getCurrentUser,
  EVENT_STATUSES,
} from '../../Components/event-management/utils/constants';



export function useOrganizerData() {
  const currentUser = getCurrentUser();

  const [myEvents, setMyEvents] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [regCountByEvent, setRegCountByEvent] = useState({});
  const [currentFilter, setCurrentFilter] = useState('all');
  const [organizerProfile, setOrganizerProfile] = useState(null);
  const [earnings, setEarnings] = useState('0');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editEventId, setEditEventId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    communityId: '',
    date: '',
    time: '6:00 PM',
    maxAttendees: 100,
    entryFee: 0,
    prizePool: 0,
    status: EVENT_STATUSES.PENDING,
  });

  const { toastMsg, showToast } = useToast();
  const { getStoredItems, addStoredItem, updateStoredItem, removeStoredItem } =
    useLocalStorageFallback(STORAGE_KEYS.EVENTS);

  const loadData = useCallback(async () => {
    setLoading(true);
    let eventsData;
    let commsData;
    let regsData = [];

    const headers = {
      'x-role': currentUser?.role || 'organizer',
      ...(currentUser?.id ? { 'x-user-id': String(currentUser.id) } : {}),
    };

    try {
      const [evRes, commRes, regRes] = await Promise.all([
        eventService.getEvents(headers),
        eventService.getCommunities(headers),
        eventService.getRegistrations(headers),
      ]);
      eventsData = evRes;
      commsData = commRes;
      regsData = regRes;
    } catch {
      eventsData = getStoredItems();
      try {
        commsData = JSON.parse(localStorage.getItem('communities') || '[]');
      } catch {
        commsData = [];
      }
    }

    if (!commsData || !Array.isArray(commsData)) {
      commsData = [];
    }
    setAllCommunities(commsData);

    const userEvents = (eventsData || []).filter(
      (e) =>
        (currentUser?.id && (e.organiserId === currentUser.id || e.organizerId === currentUser.id)) ||
        (currentUser?.username && e.createdBy === currentUser.username) ||
        (currentUser?.name && e.createdBy === currentUser.name)
    );
    setMyEvents(userEvents);

    const regCounts = {};
    (regsData || []).forEach((r) => {
      regCounts[r.eventId] = (regCounts[r.eventId] || 0) + 1;
    });
    setRegCountByEvent(regCounts);

    // Profile & Analytics
    if (currentUser?.id) {
      try {
        const profRes = await fetch(
          `${API_BASE}/organisers/profile?userId=${currentUser.id}`,
          { headers }
        );
        if (profRes.ok) {
          setOrganizerProfile(await profRes.json());
        }
      } catch {
        setOrganizerProfile({
          plan: 'free',
          limits: { maxActiveTournaments: 2, maxParticipants: 64 },
        });
      }

      try {
        const anaRes = await fetch(
          `${API_BASE}/organisers/analytics?userId=${currentUser.id}`,
          { headers }
        );
        if (anaRes.ok) {
          const ana = await anaRes.json();
          setEarnings(Number(ana.estimatedOrganiserEarnings || 0).toLocaleString());
        }
      } catch {
        setEarnings('0');
      }
    } else {
      setOrganizerProfile({
        plan: 'free',
        limits: { maxActiveTournaments: 2, maxParticipants: 64 },
      });
      setEarnings('0');
    }

    setLoading(false);
  }, [currentUser?.id, currentUser?.role, currentUser?.username, currentUser?.name, getStoredItems]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpgradePlan = async () => {
    try {
      if (currentUser?.id) {
        await eventService.upgradeOrganizerPlan(currentUser.id, 'premium');
      }
      showToast('🏆 Upgraded to Premium Organizer!');
      setOrganizerProfile((prev) => ({
        ...prev,
        plan: 'premium',
        limits: { maxActiveTournaments: 'Unlimited', maxParticipants: 'Unlimited' },
      }));
    } catch {
      showToast('⚠️ Could not upgrade plan');
    }
  };

  const handlePromoteEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/featured-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-role': currentUser.role || 'organizer',
          ...(currentUser?.id ? { 'x-user-id': String(currentUser.id) } : {}),
        },
        body: JSON.stringify({
          eventId: Number(eventId),
          userId: Number(currentUser.id),
          durationDays: 7,
        }),
      });
      if (res.ok) {
        showToast('📣 Promoted to the Discover carousel for 7 days');
      } else {
        showToast('⚠️ Could not promote event');
      }
    } catch {
      showToast('⚠️ Could not promote event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this tournament? This cannot be undone.')) return;
    try {
      await eventService.deleteEvent(id);
      showToast('🗑️ Tournament deleted');
    } catch {
      removeStoredItem(id);
      showToast('🗑️ Tournament deleted');
    }
    setMyEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const openCreateModal = () => {
    if (allCommunities.length === 0) {
      showToast('⚠️ No communities available — join or create one first');
      return;
    }
    setModalMode('create');
    setEditEventId(null);
    setFormData({
      title: '',
      description: '',
      communityId: String(allCommunities[0]?.id || ''),
      date: new Date().toISOString().slice(0, 10),
      time: '6:00 PM',
      maxAttendees: 100,
      entryFee: 0,
      prizePool: 0,
      status: EVENT_STATUSES.PENDING,
    });
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
        if (formData.status === EVENT_STATUSES.CANCELLED) {
          finalStatus = EVENT_STATUSES.CANCELLED;
        } else {
          finalStatus = existingStatus;
        }
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
      if (modalMode === 'create') {
        const created = await eventService.createEvent(payload);
        setMyEvents((prev) => [created, ...prev]);
        showToast('🏆 Tournament created');
      } else {
        const updated = await eventService.updateEvent(editEventId, payload);
        setMyEvents((prev) =>
          prev.map((item) => (item.id === editEventId ? updated : item))
        );
        showToast('✅ Tournament updated');
      }
    } catch (err) {
      // err.status is set only when the backend answered (see eventService).
      // Then it rejected the request on purpose (plan limit, date clash,
      // validation), so show the real reason and keep the modal open.
      // Before, every error fell through to "created (locally)" below.
      if (err.status) {
        showToast(`⚠️ ${err.message}`);
        return;
      }
      // Backend unreachable: keep the existing local fallback.
      if (modalMode === 'create') {
        const localCreated = { ...payload, id: Date.now() };
        setMyEvents((prev) => [localCreated, ...prev]);
        addStoredItem(localCreated);
        showToast('🏆 Tournament created (locally)');
      } else {
        setMyEvents((prev) =>
          prev.map((item) =>
            item.id === editEventId ? { ...item, ...payload } : item
          )
        );
        updateStoredItem(editEventId, payload);
        showToast('✅ Tournament updated (locally)');
      }
    }

    setModalOpen(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const totalCount = myEvents.length;
  const pendingCount = myEvents.filter(
    (e) => e.status === EVENT_STATUSES.PENDING
  ).length;
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
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

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
    toastMsg,
  };
}
