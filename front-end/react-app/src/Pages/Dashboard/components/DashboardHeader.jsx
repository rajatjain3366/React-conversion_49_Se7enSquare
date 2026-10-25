import React from 'react';

/**
 * DashboardHeader Component
 * Search bar, search dropdown results, quick actions, notification indicator, and user profile avatar.
 */
export default function DashboardHeader({
  searchQuery,
  searchResults,
  showSearch,
  setShowSearch,
  handleSearch,
  unreadCount,
  user,
  navigate,
}) {
  return (
    <header className="header">
      <div className="header-title">Home</div>
      <div className="header-search" style={{ position: 'relative' }}>
        <span>🔍</span>
        <input
          type="text"
          id="dashSearchInput"
          placeholder="Search communities, people, events…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setShowSearch(false), 200)}
          onFocus={() => searchQuery && setShowSearch(true)}
        />
        {showSearch && searchResults.length > 0 && (
          <div
            id="dashSearchResults"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '6px',
              background: 'var(--bg-card,#151d2f)',
              border: '1px solid var(--border,rgba(255,255,255,0.08))',
              borderRadius: '10px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
              maxHeight: '360px',
              overflowY: 'auto',
              zIndex: 50,
            }}
          >
            {searchResults.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
                onMouseDown={() => {
                  if (r.type === 'community') navigate('/discovery');
                  else navigate('/events');
                }}
              >
                <span>{r.icon}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary,#aaa)' }}>{r.label}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    color: 'var(--text-3,#666)',
                    textTransform: 'uppercase',
                  }}
                >
                  {r.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="header-actions">
        <button
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', marginRight: '12px' }}
          onClick={() => navigate('/create-community')}
        >
          + Create Community
        </button>
        <div className="icon-btn" id="headerNotif" data-tooltip="Notifications">
          🔔
          {unreadCount > 0 && <div className="notif-dot"></div>}
        </div>
        <div
          className="header-avatar user-avatar"
          id="headerProfile"
          data-tooltip="Profile"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/profile-settings')}
        >
          {(
            (user?.firstName?.[0] || user?.username?.[0] || user?.name?.[0] || 'U') +
            (user?.lastName?.[0] || '')
          ).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
