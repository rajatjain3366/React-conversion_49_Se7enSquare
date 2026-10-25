import React from 'react';

/**
 * GreetingBanner Component
 * Shows personalized greeting, unread notification count, upcoming events, and user-centric stats.
 * Stats reflect the current user's data (joined + created communities, notifications, events), not platform totals.
 */
export default function GreetingBanner({ greeting, user, unreadCount, events = [], stats, communities, createdCommunities }) {
  // User-centric community count: joined + created (deduplicated by id)
  const allUserCommunities = [
    ...(communities || []),
    ...(createdCommunities || []).filter(
      (c) => !(communities || []).some((j) => String(j.id) === String(c.id))
    ),
  ];

  const displayName = user?.firstName || user?.username || user?.name || 'Gamer';

  return (
    <div className="greeting">
      <div className="greeting-text">
        <div className="greeting-name">
          {greeting}, <span className="user-name">{displayName}</span> 👋
        </div>
        <div className="greeting-sub">
          You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''} and {events.length} upcoming event{events.length !== 1 ? 's' : ''}.
        </div>
      </div>
      <div className="greeting-stats">
        <div className="g-stat">
          <div className="g-stat-val">{allUserCommunities.length}</div>
          <div className="g-stat-label">Communities</div>
        </div>
        <div className="g-stat">
          <div className="g-stat-val">{unreadCount}</div>
          <div className="g-stat-label">Notifications</div>
        </div>
        <div className="g-stat">
          <div className="g-stat-val">{events.length}</div>
          <div className="g-stat-label">Events</div>
        </div>
      </div>
    </div>
  );
}
