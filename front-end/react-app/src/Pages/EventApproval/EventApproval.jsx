// Page container component for the Event Approval Dashboard.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SideBar from '../../Components/SideBar';
import '../../styles/global.css';
import '../../styles/sidebar.css';
import '../../styles/event-approval.css';

import { useToast } from '../../Components/event-management/hooks/useToast';
import { getCommunityName } from '../../Components/event-management/utils/getCommunityName';
import { EVENT_STATUSES } from '../../Components/event-management/utils/constants';
import {
  fetchEvents,
  updateEventStatus,
  selectEventsLoading,
  selectEventsByStatus,
} from '../../store/slices/eventsSlice';
import { fetchCommunityList, selectAllCommunities } from '../../store/slices/communitiesSlice';

import SummaryBar from './SummaryBar';
import ApprovalList from './ApprovalList';
import EventDetailModal from './EventDetailModal';

export default function EventApproval() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector(selectEventsLoading);
  const { pending: pendingList, approved: approvedList, rejected: rejectedList } = useSelector(selectEventsByStatus);
  const communities = useSelector(selectAllCommunities);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchCommunityList());
  }, [dispatch]);

  // A backend refusal (e.g. "An approved event already exists ... at the selected
  // date and time") is shown and nothing changes. If the backend cannot be reached,
  // the slice keeps the local fallback and reports local: true.
  const changeStatus = async (id, status, onlineMsg, offlineMsg) => {
    try {
      const { local } = await dispatch(updateEventStatus({ id, status })).unwrap();
      showToast(local ? offlineMsg : onlineMsg);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleApprove = (id) => changeStatus(
    id, EVENT_STATUSES.APPROVED, '✅ Event approved — all users will now see it.', '✅ Event approved (locally).'
  );

  const handleReject = (id) => changeStatus(
    id, EVENT_STATUSES.REJECTED, '❌ Event rejected.', '❌ Event rejected (locally).'
  );

  const openDetails = (ev) => {
    setSelectedEvent(ev);
    setModalOpen(true);
  };

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

    </div>
  );
}
