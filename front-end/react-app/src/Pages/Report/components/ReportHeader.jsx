import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Report Header with clean breadcrumbs.
 */
export default function ReportHeader({ userInitials, target }) {
  const navigate = useNavigate();

  const renderBreadcrumb = () => {
    if (target?.type === 'message') {
      return (
        <div className="breadcrumb">
          {/* /chat without ?community= is empty, so go to Discover to pick a community */}
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/discovery')}>Chat</span>
          <span className="sep">&gt;</span>
          <span>{target.author ? `@${target.author}` : 'Message'}</span>
          <span className="sep">&gt;</span>
          <span className="current">🚩 Report Message</span>
        </div>
      );
    }

    if (target?.type === 'user') {
      return (
        <div className="breadcrumb">
          <span>Users</span>
          <span className="sep">&gt;</span>
          <span>{target.name ? target.name : `User #${target.id}`}</span>
          <span className="sep">&gt;</span>
          <span className="current">🚩 Report User</span>
        </div>
      );
    }

    return (
      <div className="breadcrumb">
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Home</span>
        <span className="sep">&gt;</span>
        <span>Safety & Moderation</span>
        <span className="sep">&gt;</span>
        <span className="current">🚩 Report User</span>
      </div>
    );
  };

  return (
    <header className="header">
      {renderBreadcrumb()}
      <div className="header-actions">
        <div className="icon-btn" title="Notifications">
          🔔<div className="notif-dot"></div>
        </div>
        <div
          className="header-avatar user-avatar"
          style={{ cursor: 'pointer' }}
          title="Profile Settings"
          onClick={() => navigate('/profile-settings')}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
}
