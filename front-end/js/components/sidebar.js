/**
 * Gameunity - Unified Role-Based Sidebar
 * Section-based navigation for user, moderator, community manager, and admin.
 */

const NAV_USER = {
  label: null,
  sectionId: 'main',
  items: [
    { id: 'dashboard', name: 'Dashboard', link: 'dashboard.html', icon: '🏠' },
    { id: 'discovery', name: 'Discover', link: 'discovery.html', icon: '🔭' },
    { id: 'events', name: 'Events', link: 'events.html', icon: '📅' },
    { id: 'pricing', name: 'Pricing', link: 'pricing.html', icon: '💎' },
    { id: 'profile', name: 'Profile', link: 'profile-settings.html', icon: '⚙️' },
  ],
};

const NAV_MOD = {
  label: 'Moderation',
  sectionId: 'moderator',
  items: [
    { id: 'mod-panel', name: 'Moderator Panel', link: 'mod-panel.html', icon: '🛡️', badge: 'MODERATOR' },
    { id: 'report', name: 'Reports', link: 'report.html', icon: '🚩' },
  ],
};

const NAV_CM = {
  label: 'Community',
  sectionId: 'community-management',
  items: [
    { id: 'event-approval', name: 'Event Approval', link: 'event-approval.html', icon: '📅', badge: 'CM' },
  ],
};

// Organizer creates/manages its own tournaments — distinct from NAV_CM's Event
// Approval, which is a community_manager/admin review queue for OTHER events.
const NAV_ORGANIZER = {
  label: 'Tournaments',
  sectionId: 'organizer',
  items: [
    { id: 'organizer-dash', name: 'Organizer Dashboard', link: 'organizer-dashboard.html', icon: '🏆', badge: 'ORGANIZER' },
  ],
};

const NAV_ADMIN = {
  label: 'Admin',
  sectionId: 'admin',
  items: [
    { id: 'admin-dash', name: 'Admin Panel', link: 'admin-dashboard.html', icon: '⚡', badge: 'ADMIN' },
    { id: 'users', name: 'User Management', link: 'admin-dashboard.html#users', icon: '👤' },
    { id: 'communities', name: 'Communities', link: 'admin-dashboard.html#communities', icon: '🏘️' },
    { id: 'applications', name: 'Applications', link: 'admin-dashboard.html#applications', icon: '📝' },
    { id: 'audit', name: 'Audit Logs', link: 'admin-dashboard.html#audit', icon: '📋' },
  ],
};

// Owner sees statistics/health only — not the regular user nav (dashboard,
// discovery, etc. are all off-limits per PAGE_ACCESS anyway).
const NAV_OWNER = {
  label: null,
  sectionId: 'owner',
  items: [
    { id: 'owner-dash', name: 'Platform Statistics', link: 'owner-dashboard.html', icon: '📊', badge: 'OWNER' },
    { id: 'profile', name: 'Profile', link: 'profile-settings.html', icon: '⚙️' },
  ],
};

const ROLE_META = {
  user: { tier: 'User', color: '#34d399', accent: '#34d399', badge: null },
  moderator: { tier: 'Moderator', color: '#818cf8', accent: '#6366f1', badge: 'MODERATOR' },
  community_manager: { tier: 'Community Manager', color: '#06b6d4', accent: '#06b6d4', badge: 'CM' },
  organizer: { tier: 'Organizer', color: '#22c55e', accent: '#22c55e', badge: 'ORGANIZER' },
  admin: { tier: 'System Admin', color: '#f59e0b', accent: '#f59e0b', badge: 'ADMIN' },
  owner: { tier: 'Owner', color: '#e879f9', accent: '#e879f9', badge: 'OWNER' },
};

let _collapsed = localStorage.getItem('nexus_sidebar_collapsed') === 'true';
let _mobileOpen = false;

function _normalizeRole(role) {
  if (typeof normalizeRole === 'function') return normalizeRole(role);
  if (role === 'gamer' || !role) return 'user';
  return role;
}

function _getSections(role) {
  const normalizedRole = _normalizeRole(role);
  if (normalizedRole === 'owner') return [NAV_OWNER];

  const sections = [NAV_USER];
  if (normalizedRole === 'moderator' || normalizedRole === 'admin') sections.push(NAV_MOD);
  if (normalizedRole === 'community_manager' || normalizedRole === 'admin') sections.push(NAV_CM);
  if (normalizedRole === 'organizer' || normalizedRole === 'admin') sections.push(NAV_ORGANIZER);
  if (normalizedRole === 'admin') sections.push(NAV_ADMIN);
  return sections;
}

function _getActivePage() {
  const page = (window.location.pathname.split('/').pop() || 'dashboard.html').replace('.html', '');
  if (page === 'admin-dashboard') return 'admin-dash';
  if (page === 'owner-dashboard') return 'owner-dash';
  if (page === 'organizer-dashboard') return 'organizer-dash';
  return page;
}

function _renderItem(item) {
  const active = _getActivePage() === item.id;
  const badge = item.badge
    ? `<span class="sb-badge sb-badge--${item.badge.toLowerCase()}">${item.badge}</span>`
    : '';
  return `
    <a href="${item.link}"
       class="sb-item${active ? ' sb-item--active' : ''}"
       data-id="${item.id}"
       data-sb-tooltip="${item.name}">
      <span class="sb-item__icon" aria-hidden="true">${item.icon}</span>
      <span class="sb-item__label">${item.name}</span>
      ${badge}
    </a>`;
}

function _renderSection(section) {
  const separator = section.label
    ? `<div class="sb-section-sep"><span class="sb-section-label">${section.label}</span></div>`
    : '';
  return `
    <div class="sb-section" data-section="${section.sectionId}">
      ${separator}
      ${section.items.map(_renderItem).join('')}
    </div>`;
}

function _renderSidebar(user) {
  user = (typeof getCurrentUser === 'function' ? getCurrentUser() : user) || user;
  const role = _normalizeRole(localStorage.getItem('role') || user?.role || 'user');
  const displayName = typeof getUserFullName === 'function'
    ? getUserFullName(user)
    : (user?.fullName || user?.fullname || user?.name || user?.username || 'Guest');

  const initials = typeof getUserInitials === 'function' ? getUserInitials(user) : 'U';

  const meta = ROLE_META[role] || ROLE_META.user;
  const sections = _getSections(role);
  const colClass = _collapsed ? ' collapsed' : '';
  const homeRoutes = {
    owner: 'owner-dashboard.html',
    admin: 'admin-dashboard.html',
    organizer: 'organizer-dashboard.html',
    moderator: 'mod-panel.html',
    community_manager: 'event-approval.html',
    user: 'dashboard.html',
  };
  const homeUrl = homeRoutes[role] || 'dashboard.html';

  return `
    <div class="sb-backdrop" id="sbBackdrop" onclick="SidebarComponent.closeMobile()"></div>
    <nav class="nexus-sidebar${colClass}" id="nexusSidebar" aria-label="Main navigation" role="navigation">
      <div class="sb-brand">
        <div class="sb-brand__logo" onclick="location.href='${homeUrl}'" aria-label="Go to dashboard" style="cursor:pointer">
          <span class="sb-brand__icon">🎮</span>
          <span class="sb-brand__name">Gameunity</span>
        </div>
        <button class="sb-toggle-btn" id="sbToggleBtn" onclick="SidebarComponent.toggle(event)" aria-label="Toggle sidebar">
          <svg class="sb-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      <div class="sb-nav" role="list">${sections.map(_renderSection).join('')}</div>

      <div class="sb-profile" id="sbProfile">
        <div class="sb-profile__av user-avatar" onclick="location.href='profile-settings.html'" style="box-shadow:0 0 0 2px ${meta.accent}55">${initials}</div>
        <div class="sb-profile__info">
          <div class="sb-profile__name user-name">${displayName}</div>
          <div class="sb-profile__role" style="color:${meta.color}">
            ${meta.badge ? `<span class="sb-profile__badge" style="background:${meta.color}18;border-color:${meta.color}40;color:${meta.color}">${meta.badge}</span>` : ''}
            <span class="user-role">${meta.tier}</span>
          </div>
        </div>
        <button class="sb-profile__logout" onclick="typeof logoutUser === 'function' ? logoutUser() : (location.href='login.html')" aria-label="Log out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </nav>
    <button class="sb-mobile-open" id="sbMobileOpen" onclick="SidebarComponent.openMobile()" aria-label="Open navigation">
      <span></span><span></span><span></span>
    </button>`;
}

window.SidebarComponent = {
  init() {
    const el = document.getElementById('sidebar-container');
    if (!el) return;

    let user = null;
    try {
      const raw = localStorage.getItem('nexus_user');
      user = raw ? JSON.parse(raw) : null;
    } catch (e) { }

    el.innerHTML = _renderSidebar(user);
    this._applyCollapsed();
    this._bindKeys();
    if (typeof renderUserUI === 'function') renderUserUI();
  },

  toggle(e) {
    if (e) e.stopPropagation();
    _collapsed = !_collapsed;
    localStorage.setItem('nexus_sidebar_collapsed', _collapsed);
    this._applyCollapsed();
  },

  openMobile() {
    _mobileOpen = true;
    document.getElementById('nexusSidebar')?.classList.add('mobile-open');
    document.getElementById('sbBackdrop')?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },

  closeMobile() {
    _mobileOpen = false;
    document.getElementById('nexusSidebar')?.classList.remove('mobile-open');
    document.getElementById('sbBackdrop')?.classList.remove('visible');
    document.body.style.overflow = '';
  },

  switchRole(role) {
    let user = {};
    try { user = JSON.parse(localStorage.getItem('nexus_user') || '{}'); } catch (e) { }
    user.role = _normalizeRole(role);
    user.name = user.name || user.username || 'Demo User';
    if (typeof persistCurrentUser === 'function') persistCurrentUser(user);
    else {
      localStorage.setItem('nexus_user', JSON.stringify(user));
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('role', user.role);
    }
    window.location.reload();
  },

  _applyCollapsed() {
    const sb = document.getElementById('nexusSidebar');
    const btn = document.getElementById('sbToggleBtn');
    if (!sb) return;
    sb.classList.toggle('collapsed', _collapsed);
    if (btn) btn.classList.toggle('rotated', _collapsed);
  },

  _bindKeys() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && _mobileOpen) this.closeMobile();
    });
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SidebarComponent.init());
} else {
  SidebarComponent.init();
}
