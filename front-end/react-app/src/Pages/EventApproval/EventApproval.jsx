// Page container component for the Event Approval Dashboard.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../../Components/SideBar';
import '../../styles/global.css';
import '../../styles/sidebar.css';
import '../../styles/event-approval.css';

import { eventService } from '../../Components/event-management/services/eventService';
import { useToast } from '../../Components/event-management/hooks/useToast';
import { useLocalStorageFallback } from '../../Components/event-management/hooks/useLocalStorageFallback';
import { getCommunityName } from '../../Components/event-management/utils/getCommunityName';
import { STORAGE_KEYS, EVENT_STATUSES } from '../../Components/event-management/utils/constants';

import Toast from '../../Components/event-management/common/Toast';
import SummaryBar from './SummaryBar';
import ApprovalList from './ApprovalList';
import EventDetailModal from './EventDetailModal';

export default function EventApproval() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { toastMsg, showToast } = useToast();
  const { getStoredItems, updateStoredItem } = useLocalStorageFallback(STORAGE_KEYS.EVENTS);

  const loadData = useCallback(async () => {
    setLoading(true);
    let evList = [];
    let commList = [];

    try {
      const [evRes, commRes] = await Promise.all([
        eventService.getEvents().catch(() => []),
        eventService.getCommunities().catch(() => []),
      ]);
      evList = evRes;
      commList = commRes;
    } catch {
      // ignore network errors
    }

    if (!evList || evList.length === 0) {
      const stored = getStoredItems();
      if (stored.length > 0) evList = stored;
    }

    setEvents(Array.isArray(evList) ? evList : []);
    setCommunities(Array.isArray(commList) ? commList : []);
    setLoading(false);
  }, [getStoredItems]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id) => {
    try {
      await eventService.updateEvent(id, { status: EVENT_STATUSES.APPROVED });
      showToast('✅ Event approved — all users will now see it.');
    } catch (err) {
      // err.status is set only when the backend answered (see eventService),
      // e.g. "An approved event already exists ... at the selected date and
      // time". Show that reason and leave the event unchanged.
      if (err.status) {
        showToast(`⚠️ ${err.message}`);
        return;
      }
      // Backend unreachable: keep the existing local fallback.
      updateStoredItem(id, { status: EVENT_STATUSES.APPROVED });
      showToast('✅ Event approved (locally).');
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: EVENT_STATUSES.APPROVED } : e))
    );
  };

  const handleReject = async (id) => {
    try {
      await eventService.updateEvent(id, { status: EVENT_STATUSES.REJECTED });
      showToast('❌ Event rejected.');
    } catch (err) {
      // Same as approve: real server error -> show it, change nothing.
      if (err.status) {
        showToast(`⚠️ ${err.message}`);
        return;
      }
      // Backend unreachable: keep the existing local fallback.
      updateStoredItem(id, { status: EVENT_STATUSES.REJECTED });
      showToast('❌ Event rejected (locally).');
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: EVENT_STATUSES.REJECTED } : e))
    );
  };

  const openDetails = (ev) => {
    setSelectedEvent(ev);
    setModalOpen(true);
  };

  const pendingList = events.filter((e) => e.status === EVENT_STATUSES.PENDING);
  const approvedList = events.filter((e) => e.status === EVENT_STATUSES.APPROVED);
  const rejectedList = events.filter((e) => e.status === EVENT_STATUSES.REJECTED);

  return (
    <div className="app-shell">
      <SideBar />

      <main className="approval-main">
        <header className="approval-header">
          <div>
            <p className="approval-kicker">Community Operations</p>
            <h1>Event Requests</h1>
          </div>
          <button className="approval-secondary-btn" onClick={() => navigate('/events')}>
            View Events
          </button>
        </header>

        <SummaryBar
          pendingCount={pendingList.length}
          approvedCount={approvedList.length}
          rejectedCount={rejectedList.length}
        />

        <ApprovalList
          title="Pending Events"
          description="Approve requests to make them visible on the events page."
          events={pendingList}
          loading={loading}
          emptyMessage="No pending event requests."
          communityNameFn={(id) => getCommunityName(id, communities)}
          onViewDetails={openDetails}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        <ApprovalList
          title="Approved Events"
          description="Live events currently visible to members."
          events={approvedList}
          loading={loading}
          emptyMessage="No events in this list."
          communityNameFn={(id) => getCommunityName(id, communities)}
          onViewDetails={openDetails}
        />

        <ApprovalList
          title="Rejected Events"
          description="Requests that were declined by the management team."
          events={rejectedList}
          loading={loading}
          emptyMessage="No rejected events."
          communityNameFn={(id) => getCommunityName(id, communities)}
          onViewDetails={openDetails}
        />
      </main>

      <EventDetailModal
        event={selectedEvent}
        isOpen={modalOpen && !!selectedEvent}
        onClose={() => setModalOpen(false)}
        communityName={selectedEvent ? getCommunityName(selectedEvent.communityId, communities) : ''}
      />

      <Toast message={toastMsg} />
    </div>
  );
}
