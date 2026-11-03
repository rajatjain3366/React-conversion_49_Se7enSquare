import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { selectAdminStats } from '../store/selectors/adminSelectors';
import AppShell from '../Components/platform/layout/AppShell';
import useToast from '../Components/platform/hooks/useToast';
import useAdminUsers from './AdminDashboard/hooks/useAdminUsers';
import useAdminCommunities from './AdminDashboard/hooks/useAdminCommunities';
import useAdminModeration from './AdminDashboard/hooks/useAdminModeration';
import useAuditLog from './AdminDashboard/hooks/useAuditLog';
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
import AuditLogTab from './AdminDashboard/components/AuditLogTab';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/admin-dashboard.css';

function toAdminUser(raw) {
  const u = raw || {};
  return {
    id: u.id,
    role: u.role || 'admin',
    firstName: u.firstName || u.name?.split(' ')[0] || 'Admin',
    username: u.username || 'admin',
  };
}

/**
 * Admin Dashboard Page Component
 * Orchestrates sub-hooks and subcomponents for platform administration:
 * Overview, Users, Communities, Escalated Reports, Events, Appeals, Applications, and Audit Log.
 * All admin data lives in the Redux store (adminUsers, adminCommunities, adminModeration, auditLog).
 */
export default function AdminDashboard() {
  const adminUser = toAdminUser(useSelector(selectCurrentUser));
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activePage, setActivePage] = useState(tabParam || 'overview');
  const [globalSearch, setGlobalSearch] = useState('');

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

  const { showToast } = useToast();
  const notify = useCallback((msg) => showToast('ℹ️', msg), [showToast]);

  const { auditLog } = useAuditLog();

  const {
    users,
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
    suspendCommunity,
    reinstateCommunity,
  } = useAdminCommunities(notify);

  const {
    reports,
    events,
    appeals,
    organizerApps,
    moderatorApps,
    handleModerationAction,
    handleAppeal,
    handleOrganizerApp,
    handleModeratorApp,
  } = useAdminModeration(notify);

  // Overview counts come from a memoized selector across the admin slices
  const stats = useSelector(selectAdminStats);

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
            auditLog={auditLog}
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

        {activePage === 'audit' && <AuditLogTab auditLog={auditLog} />}
      </div>
    </AppShell>
  );
}
