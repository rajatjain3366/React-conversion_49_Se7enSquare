import React from 'react';

/**
 * RecentNotifications Component
 * Renders user notifications list with read status, timestamps, and mark-all-read action.
 */
export default function RecentNotifications({ notifications, markAllRead }) {
  return (
    <div className="section-box">
      <div className="section-header">
        <div className="section-title">🔔 Recent Notifications</div>
        <div className="section-link" style={{ cursor: 'pointer' }} onClick={markAllRead}>
          Mark all read
        </div>
      </div>
      <div className="notif-list" id="notif-list-container">
        {notifications.length === 0 ? (
          <div className="dash-empty-state">
            <span className="dash-empty-icon">🔔</span>
            <div className="dash-empty-title">All caught up!</div>
            <div className="dash-empty-desc">No new notifications right now. Activity and alerts will appear here.</div>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item${n.read ? ' read' : ''}`}
            >
              <div className="notif-icon-bubble">{n.icon || '💬'}</div>
              <div className="notif-body">
                <div className="notif-text">{n.text}</div>
                <div className="notif-time">{n.time}</div>
              </div>
              {!n.read && <div className="notif-unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
