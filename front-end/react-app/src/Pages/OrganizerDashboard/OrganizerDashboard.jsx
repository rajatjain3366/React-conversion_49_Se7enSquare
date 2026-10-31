// Container orchestrator for the Organizer Dashboard module.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../../Components/SideBar';
import '../../styles/global.css';
import '../../styles/sidebar.css';
import '../../styles/admin-dashboard.css';

import { getCommunityName } from '../../Components/event-management/utils/getCommunityName';
import PageHeader from '../../Components/event-management/common/PageHeader';
import Toast from '../../Components/event-management/common/Toast';

import PlanCard from './PlanCard';
import StatsGrid from './StatsGrid';
import DashboardFilterBar from './DashboardFilterBar';
import TournamentsTable from './TournamentsTable';
import TournamentModal from './TournamentModal';
import { useOrganizerData } from './useOrganizerData';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const {
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
    currentUser,
  } = useOrganizerData();

  // Backend: DELETE /events/:id is admin-only (organizers get 403).
  // So only an admin viewing this dashboard gets a Delete button.
  const canDeleteEvents = currentUser?.role === 'admin';

  return (
    <div className="app-shell">
      <SideBar />

      <div className="main">
        <PageHeader
          icon="🏆"
          title="Organizer Dashboard"
          rightActions={
            <div
              className="header-avatar user-avatar"
              onClick={() => navigate('/profile-settings')}
              style={{ cursor: 'pointer' }}
              title="Profile Settings"
            />
          }
        >
          <span className="header-badge" style={{ marginLeft: '12px' }}>
            ORGANIZER
          </span>
        </PageHeader>

        <div className="page active">
          <p
            style={{
              color: 'var(--text-3, #9ca3af)',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            Create and manage the tournaments you host. Scoped to tournaments
            you created.
          </p>

          <PlanCard
            isPremium={isPremium}
            organizerProfile={organizerProfile}
            onUpgrade={handleUpgradePlan}
          />

          <StatsGrid
            totalCount={totalCount}
            totalRegistrations={totalRegistrations}
            pendingCount={pendingCount}
            upcomingCount={upcomingCount}
            earnings={earnings}
          />

          <DashboardFilterBar
            currentFilter={currentFilter}
            onSelectFilter={setCurrentFilter}
            onHostTournament={openCreateModal}
          />

          <TournamentsTable
            tournaments={filteredEvents}
            loading={loading}
            currentFilter={currentFilter}
            getCommunityName={(id) => getCommunityName(id, allCommunities)}
            regCountByEvent={regCountByEvent}
            onEdit={openEditModal}
            onPromote={handlePromoteEvent}
            onViewRegistrants={(id) =>
              navigate(`/event-registrants?eventId=${id}`)
            }
            onDelete={canDeleteEvents ? handleDeleteEvent : undefined}
            onHostTournament={openCreateModal}
          />
        </div>
      </div>

      <TournamentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        modalMode={modalMode}
        formData={formData}
        setFormData={setFormData}
        communities={allCommunities}
        onSubmit={handleModalSubmit}
      />

      <Toast message={toastMsg} />
    </div>
  );
}
