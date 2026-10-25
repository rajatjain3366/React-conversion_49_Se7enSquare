import React from 'react';

const ALL_TABS = [
  { tab: 'profile',      icon: '👤', label: 'My Profile' },
  { tab: 'account',      icon: '🔐', label: 'Account & Security' },
  { tab: 'membership',   icon: '💎', label: 'Membership', hideForRoles: ['owner'] },
  { tab: 'privacy',      icon: '🔒', label: 'Privacy' },
];

/**
 * Left navigation sidebar for ProfileSettings — avatar, display name, section links.
 * Membership tab is hidden for the owner role (owners have no subscription or role applications).
 */
export default function ProfileNav({ formData, initials, activeTab, onSelectTab, userRole }) {
  const role = (userRole || 'user').toLowerCase();
  const visibleTabs = ALL_TABS.filter(t => !t.hideForRoles || !t.hideForRoles.includes(role));

  return (
    <nav className="left-nav">
      <div className="nav-profile" onClick={() => onSelectTab('profile')}>
        <div className="profile-av-wrap">
          <div
            className="profile-av user-avatar"
            style={{
              backgroundImage:    formData.avatar ? `url(${formData.avatar})` : 'none',
              backgroundSize:     'cover',
              backgroundPosition: 'center',
              display:            'flex',
              alignItems:         'center',
              justifyContent:     'center',
              fontWeight:         700,
              fontSize:           '24px',
            }}
          >
            {!formData.avatar && initials}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="profile-name user-name">{formData.firstName || formData.username} {formData.lastName || ''}</div>
          <div className="profile-handle">@{formData.username}</div>
          <div style={{ marginTop: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                background:
                  role === 'owner' ? 'rgba(232, 121, 249, 0.15)' :
                  role === 'admin' ? 'rgba(245, 158, 11, 0.15)' :
                  role === 'organizer' ? 'rgba(34, 197, 94, 0.15)' :
                  role === 'moderator' ? 'rgba(129, 140, 248, 0.15)' :
                  role === 'community_manager' ? 'rgba(6, 182, 212, 0.15)' :
                  'rgba(52, 211, 153, 0.15)',
                color:
                  role === 'owner' ? '#e879f9' :
                  role === 'admin' ? '#f59e0b' :
                  role === 'organizer' ? '#22c55e' :
                  role === 'moderator' ? '#818cf8' :
                  role === 'community_manager' ? '#06b6d4' :
                  '#34d399',
                border: `1px solid ${
                  role === 'owner' ? 'rgba(232, 121, 249, 0.3)' :
                  role === 'admin' ? 'rgba(245, 158, 11, 0.3)' :
                  role === 'organizer' ? 'rgba(34, 197, 94, 0.3)' :
                  role === 'moderator' ? 'rgba(129, 140, 248, 0.3)' :
                  role === 'community_manager' ? 'rgba(6, 182, 212, 0.3)' :
                  'rgba(52, 211, 153, 0.3)'
                }`,
              }}
            >
              {role === 'owner' ? '👑 Platform Owner' :
               role === 'admin' ? '⚡ System Admin' :
               role === 'organizer' ? '🏆 Verified Organizer' :
               role === 'moderator' ? '🛡️ Certified Moderator' :
               role === 'community_manager' ? '📅 Community Manager' :
               '🎮 Member'}
            </span>
          </div>
        </div>
      </div>

      <div className="ln-section">
        <div className="ln-label">Account</div>
        {visibleTabs.map(({ tab, icon, label }) => (
          <div
            key={tab}
            className={`ln-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onSelectTab(tab)}
          >
            <span className="ln-icon">{icon}</span> {label}
          </div>
        ))}
      </div>

      <div className="ln-section">
        <div
          className={`ln-item ln-danger ${activeTab === 'danger' ? 'active' : ''}`}
          onClick={() => onSelectTab('danger')}
        >
          <span className="ln-icon">⚠️</span> Danger Zone
        </div>
      </div>
    </nav>
  );
}
