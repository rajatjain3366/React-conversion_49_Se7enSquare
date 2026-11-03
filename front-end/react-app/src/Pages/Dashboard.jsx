import React from 'react';
import SideBar from '../Components/SideBar';
import useDashboard from './Dashboard/hooks/useDashboard';
import DashboardHeader from './Dashboard/components/DashboardHeader';
import GreetingBanner from './Dashboard/components/GreetingBanner';
import JoinedCommunities from './Dashboard/components/JoinedCommunities';
import RecentNotifications from './Dashboard/components/RecentNotifications';
import UpcomingEvents from './Dashboard/components/UpcomingEvents';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/dashboard.css';

/**
 * Dashboard Page Component
 * Converted from dashboard.html, preserving all styles, classes, and widgets.
 * Architecture: UI/presentation orchestrator delegating to specialized components and useDashboard hook.
 */
export default function Dashboard() {
  const {
    navigate,
    user,
    greeting,
    communities,
    createdCommunities,
    notifications,
    events,
    unreadCount,
    searchQuery,
    searchResults,
    showSearch,
    setShowSearch,
    handleSearch,
    markAllRead,
    loading,
  } = useDashboard();

  return (
    <div className="app-shell">
      <SideBar />
      <div className="main">
        <DashboardHeader
          searchQuery={searchQuery}
          searchResults={searchResults}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          handleSearch={handleSearch}
          unreadCount={unreadCount}
          user={user}
          navigate={navigate}
        />

        <div className="content">
          <GreetingBanner
            greeting={greeting}
            user={user}
            unreadCount={unreadCount}
            events={events}
            communities={communities}
            createdCommunities={createdCommunities}
          />

          <JoinedCommunities
            communities={communities}
            createdCommunities={createdCommunities}
            loading={loading}
            navigate={navigate}
          />

          <div className="two-col">
            <RecentNotifications
              notifications={notifications}
              markAllRead={markAllRead}
            />

            <UpcomingEvents
              events={events}
              navigate={navigate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
