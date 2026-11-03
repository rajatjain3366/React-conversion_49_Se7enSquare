// Page container component for Events & Tournaments module.
import React, { useState, useEffect } from 'react';
import SideBar from '../../Components/SideBar';
import '../../styles/global.css';
import '../../styles/events.css';

import { useEvents } from '../../Components/event-management/hooks/useEvents';
import { useRegistrations } from '../../Components/event-management/hooks/useRegistrations';
import { useToast } from '../../Components/event-management/hooks/useToast';
import {
  CATEGORIES,
  getCurrentUser,
} from '../../Components/event-management/utils/constants';
import { getCommunityObject } from '../../Components/event-management/utils/getCommunityName';
import { eventService } from '../../Components/event-management/services/eventService';

import PageHeader from '../../Components/event-management/common/PageHeader';

import CategoryFilterChips from './CategoryFilterChips';
import FeaturedEventBanner from './FeaturedEventBanner';
import EventsGrid from './EventsGrid';
import EventDetailModal from './EventDetailModal';
import RegistrationModal from './RegistrationModal';

export default function Events() {
  const user = getCurrentUser();
  const [detailEvent, setDetailEvent] = useState(null);
  const [registerEvent, setRegisterEvent] = useState(null);
  const [communities, setCommunities] = useState([]);

  const { showToast } = useToast();
  const {
    loading: eventsLoading,
    selectedCategory,
    setSelectedCategory,
    upcomingEvents,
    deleteEvent,
    updateAttendeeCount,
  } = useEvents();

  useEffect(() => {
    eventService.getCommunities()
      .then((data) => {
        if (Array.isArray(data)) setCommunities(data);
      })
      .catch(() => {});
  }, []);

  const { isRegistered, registerForEvent, cancelRegistration } = useRegistrations();

  const handleOpenRegisterModal = (ev) => {
    if (!user || !user.id) {
      showToast('Please log in to register');
      return;
    }
    setRegisterEvent(ev);
  };

  const handleConfirmRegistration = async (ev, regData) => {
    if (!user || !user.id) {
      showToast('Please log in to register');
      return;
    }
    const res = await registerForEvent(ev, regData);
    if (res.success) {
      updateAttendeeCount(ev.id, 1);
      showToast('Registered successfully!');
      setRegisterEvent(null);
    } else {
      showToast(res.error || 'Could not register. Please try again.');
    }
  };

  const handleCancel = async (regOrEv) => {
    if (!window.confirm(`Cancel registration for "${regOrEv.title || regOrEv.eventTitle || 'this event'}"?`)) return;
    await cancelRegistration(regOrEv);
    updateAttendeeCount(regOrEv.id || regOrEv.eventId, -1);
    showToast('Registration cancelled.');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    await deleteEvent(id);
    showToast('Event deleted.');
  };

  return (
    <div className="app-shell">
      <SideBar />
      <div className="main">
        <PageHeader title="Events & Tournaments" />

        <div className="content active" id="tab-upcoming">
          <CategoryFilterChips
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {upcomingEvents.length > 0 && (
            <FeaturedEventBanner
              event={upcomingEvents[0]}
              comm={getCommunityObject(upcomingEvents[0].communityId, communities)}
              isRegistered={isRegistered(upcomingEvents[0].id)}
              onView={setDetailEvent}
              onRegister={handleOpenRegisterModal}
            />
          )}

          <div className="section-header">
            <div>
              <div className="section-title">All Upcoming Events</div>
              <div className="section-sub">{upcomingEvents.length} events across your communities</div>
            </div>
          </div>

          <EventsGrid
            events={upcomingEvents}
            loading={eventsLoading}
            getCommunity={(id) => getCommunityObject(id, communities)}
            isRegistered={isRegistered}
            onView={setDetailEvent}
            onRegister={handleOpenRegisterModal}
            onCancel={handleCancel}
            canDelete={user?.role === 'admin'}
            onDelete={handleDelete}
          />
        </div>

        <EventDetailModal
          event={detailEvent}
          isOpen={!!detailEvent}
          onClose={() => setDetailEvent(null)}
          isRegistered={detailEvent ? isRegistered(detailEvent.id) : false}
          onRegister={handleOpenRegisterModal}
        />

        <RegistrationModal
          event={registerEvent}
          isOpen={!!registerEvent}
          onClose={() => setRegisterEvent(null)}
          onSubmit={handleConfirmRegistration}
        />

        </div>
    </div>
  );
}
