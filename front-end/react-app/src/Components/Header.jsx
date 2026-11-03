import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

function getInitials(user) {
  const raw = user || {};
  const first = raw.firstName || raw.username || 'G';
  const last = raw.lastName || '';
  return (first[0] + (last[0] || first[1] || '')).toUpperCase();
}

/**
 * Reusable Header Component
 * Top bar header with icon, title, badge, action buttons, and user avatar.
 */
export default function Header({
  icon,
  title,
  badge,
  children,
  onAvatarClick,
}) {
  const navigate = useNavigate();
  const initials = getInitials(useSelector(selectCurrentUser));

  const handleAvatarClick = () => {
    if (onAvatarClick) {
      onAvatarClick();
    } else {
      navigate('/profile-settings');
    }
  };

  return (
    <header className="header">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon && <div className="header-icon">{icon}</div>}
        {title && <h1 className="header-title" style={{ margin: 0 }}>{title}</h1>}
        {badge && <span className="header-badge">{badge}</span>}
      </div>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
        {children}
        <div
          className="header-avatar user-avatar"
          onClick={handleAvatarClick}
          style={{
            cursor: 'pointer',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #5b6ef5, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
          }}
          title="Profile & Settings"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
