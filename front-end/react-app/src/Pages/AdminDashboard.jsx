import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../Components/platform/layout/AppShell';
import Toast from '../Components/platform/common/Toast';
import useToast from '../Components/platform/hooks/useToast';
import useAdminUsers from './AdminDashboard/hooks/useAdminUsers';
import useAdminCommunities from './AdminDashboard/hooks/useAdminCommunities';
import useAdminModeration from './AdminDashboard/hooks/useAdminModeration';
import { PAGES } from '../Components/platform/data/adminData';
import AdminHeader from './AdminDashboard/components/AdminHeader';
import AdminNav from './AdminDashboard/components/AdminNav';
import OverviewTab from './AdminDashboard/components/OverviewTab';
import UsersTab from './AdminDashboard/components/UsersTab';
import CommunitiesTab from './AdminDashboard/components/CommunitiesTab';
import EscalatedReportsTab from './AdminDashboard/components/EscalatedReportsTab';
import EventsTab from './AdminDashboard/components/EventsTab';
import AppealsTab from './AdminDashboard/components/AppealsTab';
import ApplicationsTab from './AdminDashboard/components/ApplicationsTab';
import { apiRequest, getStoredUser } from '../services/api';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/admin-dashboard.css';

function getAdminUser() {
  try {
    const raw = getStoredUser() || {};
    return {
      id: raw.id,
      role: raw.role || 'admin',
      firstName: raw.firstName || raw.name?.split(' ')[0] || 'Admin',
      username: raw.username || 'admin',
    };
  } catch {
    return { id: undefined, role: 'admin', firstName: 'Admin', username: 'admin' };
  }
}

/**
 * Admin Dashboard Page Component
 * Orchestrates sub-hooks and subcomponents for platform administration:
 * Overview, Users, Communities, Escalated Reports, Events, Appeals, and Applications.
 */
export default function AdminDashboard() {
  const adminUser = getAdminUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activePage, setActivePage] = useState(tabParam || 'overview');
  const [globalSearch, setGlobalSearch] = useState('');
  const [totalMessages, setTotalMessages] = useState(0);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && currentTab !== activePage) {
      setActivePage(currentTab);
    }
  }, [searchParams, activePage]);

  const handleSelectPage = useCallback((pageId) => {
    setActivePage(pageId);
    setSearchParams({ tab: pageId });
  }, [setSearchParams]);

  const { toast, showToast } = useToast();
  const notify = useCallback((msg) => showToast('ℹ️', msg), [showToast]);

  const {
    users,
    setUsers,
    refreshUsers,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    editingUser,
    setEditingUser,
    filteredUsers,
    updateUserRole,
    suspendUser,
    banUser,
    reinstateUser,
  } = useAdminUsers(notify);

  const {
    communities,
    setCommunities,
    refreshCommunities,
    suspendCommunity,
    reinstateCommunity,
  } = useAdminCommunities(notify);

  const {
    reports,
    setReports,
    refreshReports,
    events,
    setEvents,
    appeals,
    setAppeals,
    organizerApps,
    moderatorApps,
    handleModerationAction,
    handleAppeal,
    handleOrganizerApp,
    handleModeratorApp,
  } = useAdminModeration(notify, refreshUsers);

  // Load backend stats once on mount
  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const s = await apiRequest('/dashboard/stats');
        if (isMounted && s?.totalMessages !== undefined) {
          setTotalMessages(s.totalMessages);
        }
      } catch { /* keep defaults */ }
    }
    loadStats();
    return () => { isMounted = false; };
  }, []);

  // Compute live stats strictly from active sub-hook collections without circular render loops
  const stats = useMemo(() => ({
    users: users.length,
    comms: communities.length,
    escalatedReports: reports.filter((r) => r.status === 'escalated').length,
    events: events.filter((e) => e.status === 'approved').length,
    appeals: appeals.filter((a) => a.status === 'pending').length,
    applications: (organizerApps?.filter((a) => a.status === 'pending').length || 0) + (moderatorApps?.filter((a) => a.status === 'pending').length || 0) || (organizerApps?.length || 0) + (moderatorApps?.length || 0),
    messages: totalMessages,
  }), [users, communities, reports, events, appeals, organizerApps, moderatorApps, totalMessages]);

  const currentPage = PAGES.find((p) => p.id === activePage) || PAGES[0];

  return (
    <AppShell
      customHeader={
        <AdminHeader
          currentPage={currentPage}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          adminUser={adminUser}
        />
      }
    >
      <AdminNav activePage={activePage} onSelectPage={handleSelectPage} />

      <div className="admin-content-area">
        {activePage === 'overview' && (
          <OverviewTab
            stats={stats}
            onNavigate={handleSelectPage}
          />
        )}

        {activePage === 'users' && (
          <UsersTab
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            filteredUsers={filteredUsers}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            updateUserRole={updateUserRole}
            suspendUser={suspendUser}
            banUser={banUser}
            reinstateUser={reinstateUser}
            adminUser={adminUser}
          />
        )}

        {activePage === 'communities' && (
          <CommunitiesTab
            communities={communities}
            users={users}
            suspendCommunity={suspendCommunity}
            reinstateCommunity={reinstateCommunity}
          />
        )}

        {activePage === 'escalated-reports' && (
          <EscalatedReportsTab
            reports={reports}
            users={users}
            communities={communities}
            onAction={handleModerationAction}
          />
        )}

        {activePage === 'events-mgmt' && <EventsTab events={events} />}

        {activePage === 'appeals' && (
          <AppealsTab appeals={appeals} onAppeal={handleAppeal} />
        )}

        {activePage === 'applications' && (
          <ApplicationsTab
            organizerApps={organizerApps}
            moderatorApps={moderatorApps}
            onOrganizerApp={handleOrganizerApp}
            onModeratorApp={handleModeratorApp}
          />
        )}
      </div>

      <Toast toast={toast} />
    </AppShell>
  );
}
