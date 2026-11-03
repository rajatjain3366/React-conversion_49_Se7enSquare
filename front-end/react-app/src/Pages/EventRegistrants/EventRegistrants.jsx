// Page container component for viewing event tournament registrants.
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SideBar from '../../Components/SideBar';
import '../../styles/global.css';
import '../../styles/sidebar.css';
import '../../styles/admin-dashboard.css';

import { eventService } from '../../Components/event-management/services/eventService';
import { useToast } from '../../Components/event-management/hooks/useToast';
import { STORAGE_KEYS } from '../../Components/event-management/utils/constants';
import PageHeader from '../../Components/event-management/common/PageHeader';
import EmptyState from '../../Components/event-management/common/EmptyState';
import RegistrantsTable from './RegistrantsTable';

export default function EventRegistrants() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [eventTitle, setEventTitle] = useState('Event');
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadRegistrants() {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        setErrorMsg(null);
        const data = await eventService.getEventRegistrants(eventId);
        setEventTitle(data.eventTitle || 'Tournament');
        setRegistrants(data.registrants || []);
      } catch (err) {
        let localEvents;
        try {
          localEvents = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]'
          );
        } catch {
          localEvents = [];
        }
        const localEvent = (Array.isArray(localEvents) ? localEvents : []).find(
          (e) =>
            String(e.id) === String(eventId) || Number(e.id) === Number(eventId)
        );
        if (localEvent?.title) {
          setEventTitle(localEvent.title);
        }

        const status = err?.status;
        if (status === 404) {
          if (localEvent) {
            setRegistrants([]);
            setErrorMsg('No registrants yet');
          } else {
            setRegistrants([]);
            setErrorMsg('Event not found');
          }
        } else if (status === 401 || status === 403) {
          setRegistrants([]);
          setErrorMsg("You don't have access to this tournament's registrants");
          showToast("⚠️ You don't have access to this tournament's registrants");
        } else {
          setRegistrants([]);
          setErrorMsg('Could not load registrants.');
          showToast('⚠️ Could not load registrants.');
        }
      }
      setLoading(false);
    }

    loadRegistrants();
  }, [eventId, showToast]);

  return (
    <div className="app-shell">
      <SideBar />

      <div className="main">
        <PageHeader
          icon="👥"
          title={`Registrants — ${eventTitle}`}
          rightActions={
            <>
              <button
                className="btn-ghost"
                onClick={() => navigate('/organizer-dashboard')}
              >
                ← Back to Dashboard
              </button>
              <div
                className="header-avatar user-avatar"
                onClick={() => navigate('/profile-settings')}
                style={{ cursor: 'pointer' }}
                title="Profile Settings"
              />
            </>
          }
        />

        {!eventId ? (
          <div className="page active">
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <EmptyState
                icon="⚠️"
                title="No tournament specified"
                subtitle="Please select a tournament from the Organizer Dashboard to view its registrants."
                actionText="← Back to Organizer Dashboard"
                onAction={() => navigate('/organizer-dashboard')}
              />
            </div>
          </div>
        ) : (
          <div className="page active">
            <p
              style={{
                color: 'var(--text-3, #9ca3af)',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              Everyone registered for &ldquo;{eventTitle}&rdquo;, with the details they gave at sign-up.
            </p>

            <RegistrantsTable
              registrants={registrants}
              loading={loading}
              errorMsg={errorMsg}
            />
          </div>
        )}

        </div>
    </div>
  );
}
