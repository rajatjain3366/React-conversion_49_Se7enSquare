// Page container component for viewing event tournament registrants.
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SideBar from '../../Components/SideBar';
import '../../styles/global.css';
import '../../styles/sidebar.css';
import '../../styles/admin-dashboard.css';

import { useToast } from '../../Components/event-management/hooks/useToast';
import { fetchRegistrants, selectRegistrants } from '../../store/slices/eventsSlice';
import PageHeader from '../../Components/event-management/common/PageHeader';
import EmptyState from '../../Components/event-management/common/EmptyState';
import RegistrantsTable from './RegistrantsTable';

export default function EventRegistrants() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const { title: eventTitle, list: registrants, loading, error: errorMsg } = useSelector(selectRegistrants);
  const { showToast } = useToast();

  useEffect(() => {
    if (!eventId) return;
    dispatch(fetchRegistrants(eventId))
      .unwrap()
      .catch((err) => {
        // "Not found" / "No registrants yet" are shown in the table only; other failures also get a toast
        if (err?.status !== 404) showToast(`⚠️ ${err?.message || 'Could not load registrants.'}`);
      });
  }, [dispatch, eventId, showToast]);

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
