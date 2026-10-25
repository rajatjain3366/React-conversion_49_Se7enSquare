import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { getHomeRoute } from '../services/roleAccess';
import '../styles/sidebar.css';

/**
 * Reusable Sidebar Component
 * Role-based navigation sidebar matching the original sidebar.js functionality.
 * Supports collapse, role-based sections, and mobile toggle.
 */

const NAV_USER = {
  label: null,
  sectionId: 'main',
  items: [
    { id: 'dashboard', name: 'Dashboard', link: '/dashboard', icon: '🏠' },
    { id: 'discovery', name: 'Discover', link: '/discovery', icon: '🔭' },
    { id: 'events', name: 'Events', link: '/events', icon: '📅' },
    { id: 'pricing', name: 'Pricing', link: '/pricing', icon: '💎' },
    { id: 'profile', name: 'Profile', link: '/profile-settings', icon: '⚙️' },
  ],
};

const NAV_MOD = {
  label: 'Moderation',
  sectionId: 'moderator',
  items: [
    { id: 'mod-panel', name: 'Moderator Panel', link: '/mod-panel', icon: '🛡️', badge: 'MODERATOR' },
    { id: 'report', name: 'Reports', link: '/report', icon: '🚩' },
  ],
};

const NAV_CM = {
  label: 'Community',
  sectionId: 'community-management',
  items: [
    { id: 'event-approval', name: 'Event Approval', link: '/event-approval', icon: '📅', badge: 'CM' },
  ],
};

const NAV_ORGANIZER = {
  label: 'Tournaments',
  sectionId: 'organizer',
  items: [
    { id: 'organizer-dash', name: 'Organizer Dashboard', link: '/organizer-dashboard', icon: '🏆', badge: 'ORGANIZER' },
  ],
};

const NAV_ADMIN = {
  label: 'Admin',
  sectionId: 'admin',
  items: [
    { id: 'admin-dash', name: 'Admin Panel', link: '/admin-dashboard?tab=overview', icon: '⚡', badge: 'ADMIN' },
    { id: 'users', name: 'User Management', link: '/admin-dashboard?tab=users', icon: '👤' },
    { id: 'communities-admin', name: 'Communities', link: '/admin-dashboard?tab=communities', icon: '🏘️' },
  ],
};


const NAV_OWNER = {
  label: null,
  sectionId: 'owner',
  items: [
    { id: 'owner-dash', name: 'Platform Statistics', link: '/owner-dashboard', icon: '📊', badge: 'OWNER' },
    { id: 'profile', name: 'Profile', link: '/profile-settings', icon: '⚙️' },
  ],
};

const ROLE_META = {
  user: { tier: 'User', color: '#34d399', badge: null },
  moderator: { tier: 'Moderator', color: '#818cf8', badge: 'MODERATOR' },
  community_manager: { tier: 'Community Manager', color: '#06b6d4', badge: 'CM' },
  organizer: { tier: 'Organizer', color: '#22c55e', badge: 'ORGANIZER' },
  admin: { tier: 'System Admin', color: '#f59e0b', badge: 'ADMIN' },
  owner: { tier: 'Owner', color: '#e879f9', badge: 'OWNER' },
};

function getSections(role) {
  if (role === 'owner') return [NAV_OWNER];
  const sections = [NAV_USER];
  if (role === 'moderator' || role === 'admin') sections.push(NAV_MOD);
  if (role === 'community_manager' || role === 'admin') sections.push(NAV_CM);
  if (role === 'organizer' || role === 'admin') sections.push(NAV_ORGANIZER);
  if (role === 'admin') sections.push(NAV_ADMIN);
  return sections;
}

function getCurrentUser() {
  try {
    const raw = authService.getCurrentUser() || {};
    const role = raw.role || 'user';
    return {
      firstName: raw.firstName || raw.name?.split(' ')[0] || raw.username || 'User',
      lastName: raw.lastName || raw.name?.split(' ').slice(1).join(' ') || '',
      username: raw.username || 'user',
      role,
      avatar: raw.avatar || null,
    };
  } catch {
    return { firstName: 'User', lastName: '', username: 'user', role: 'user', avatar: null };
  }
}

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('nexus_sidebar_collapsed') === 'true'
  );
  const [user, setUser] = useState(getCurrentUser);

  useEffect(() => {
    const refresh = () => setUser(getCurrentUser());
    refresh();
    window.addEventListener('session-updated', refresh);
    return () => window.removeEventListener('session-updated', refresh);
  }, [location.pathname]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('nexus_sidebar_collapsed', String(next));
  };

  const role = user.role;
  const meta = ROLE_META[role] || ROLE_META.user;
  const sections = getSections(role);
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || user.firstName?.[1] || ''}`.toUpperCase();

  const isActive = (link) => {
    const [path, search] = link.split('?');
    if (search) {
      return location.pathname === path && location.search === `?${search}`;
    }
    return location.pathname === link || location.pathname.startsWith(link + '/');
  };

  return (
    <aside
      className={`nexus-sidebar${collapsed ? ' collapsed' : ''}`}
      id="nexusSidebar"
      aria-label="Main navigation"
    >
      {/* Brand Header */}
      <div className="sb-brand">
        <Link
          to={getHomeRoute(role)}
          onClick={(e) => {
            e.preventDefault();
            const freshRole = authService.getCurrentUser()?.role || localStorage.getItem('role') || role;
            navigate(getHomeRoute(freshRole));
          }}
          className="sb-brand__logo"
          style={{ textDecoration: 'none', cursor: 'pointer' }}
          title={`Go to ${meta.tier} Home`}
        >
          <span className="sb-brand__icon">🎮</span>
          {!collapsed && <span className="sb-brand__name">Gameunity</span>}
        </Link>

        <button
          className={`sb-toggle-btn${collapsed ? ' rotated' : ''}`}
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            className="sb-toggle-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="sb-nav" role="list">
        {sections.map((section) => (
          <div key={section.sectionId} className="sb-section" data-section={section.sectionId}>
            {section.label && !collapsed && (
              <div className="sb-section-sep">
                <span className="sb-section-label">{section.label}</span>
              </div>
            )}
            {section.items.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className={`sb-item${isActive(item.link) ? ' sb-item--active' : ''}`}
                data-id={item.id}
                data-sb-tooltip={item.name}
                title={collapsed ? item.name : undefined}
              >
                <span className="sb-item__icon" aria-hidden="true">{item.icon}</span>
                {!collapsed && <span className="sb-item__label">{item.name}</span>}
                {!collapsed && item.badge && (
                  <span className={`sb-badge sb-badge--${item.badge.toLowerCase().replace(/_/g, '-')}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* User Profile Sticky Footer */}
      <div className="sb-profile" id="sbProfile">
        <Link
          to="/profile-settings"
          className="sb-profile__av user-avatar"
          style={{
            cursor: 'pointer',
            boxShadow: `0 0 0 2px ${meta.color}55`,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={`${user.firstName} ${user.lastName} (${meta.tier})`}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            initials || 'U'
          )}
        </Link>
        {!collapsed && (
          <Link
            to="/profile-settings"
            className="sb-profile__info"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <div className="sb-profile__name user-name">{user.firstName} {user.lastName}</div>
            <div className="sb-profile__role" style={{ color: meta.color }}>
              {meta.badge && (
                <span
                  className="sb-profile__badge"
                  style={{
                    background: `${meta.color}18`,
                    borderColor: `${meta.color}40`,
                    color: meta.color,
                  }}
                >
                  {meta.badge}
                </span>
              )}
              <span className="user-role">{meta.tier}</span>
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            className="sb-profile__logout"
            onClick={() => {
              authService.clearSession();
              window.location.href = '/login';
            }}
            aria-label="Log out"
            title="Log out"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}
