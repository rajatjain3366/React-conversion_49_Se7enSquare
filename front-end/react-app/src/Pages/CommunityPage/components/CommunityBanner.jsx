import React from 'react';
import { Link } from 'react-router-dom';
import { memberCountOf, onlineCountOf } from '../../../Components/platform/hooks/useCommunityPage';

/**
 * Community banner, avatar, title row, metadata chips, and action buttons
 * (Join/Leave, Settings, Delete for owners).
 */
export default function CommunityBanner({ community, joined, isOwner, foundedLabel, onToggleJoin, onDelete }) {
  // Show the community's own banner when it has one: a CSS gradient (from the
  // Create wizard) is used as-is, an uploaded image URL is wrapped in url().
  // No banner -> no inline style, so the default .comm-banner background stays.
  const bannerStyle = community.banner
    ? {
        backgroundImage: community.banner.includes('gradient(') ? community.banner : `url(${community.banner})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <div className="comm-banner-area">
      <div className="comm-banner" style={bannerStyle}>
        <div className="banner-pattern"></div>
        <div className="banner-emoji" id="comm-icon">{community.icon || '🏘️'}</div>
      </div>
      <div className="comm-profile-row">
        <div className="comm-big-icon">{community.icon || '🏘️'}</div>
        <div className="comm-title-block">
          <div className="comm-title-row">
            <h1 className="comm-big-name" id="comm-name-title">{community.name}</h1>
            <div className="verified-badge">✓ Verified</div>
          </div>
          <div className="comm-meta-row">
            <div className="meta-chip"><span className="online-dot"></span> <span id="comm-online-count">{onlineCountOf(community).toLocaleString()}</span> online</div>
            <div className="meta-chip">👥 <span id="comm-member-count">{memberCountOf(community).toLocaleString()}</span> members</div>
            <div className="meta-chip" id="comm-category">💻 {community.category || 'Gaming'} · Community</div>
            {foundedLabel && <div className="meta-chip" id="comm-founded">📅 Founded {foundedLabel}</div>}
          </div>
        </div>
        <div className="comm-actions">
          {/* Community owner sees Settings + Delete; others see Join/Leave */}
          {!isOwner && (
            <button
              className={`btn-joined-main${joined ? '' : ' not-joined'}`}
              id="joinMainBtn"
              onClick={onToggleJoin}
              style={{
                background: joined ? 'rgba(99,102,241,0.2)' : '#6366f1',
                border: joined ? '1px solid #6366f1' : 'none',
                color: '#fff', borderRadius: '10px', padding: '10px 20px',
                fontWeight: 600, cursor: 'pointer', fontSize: '14px',
              }}
            >
              {joined ? '✓ Joined' : '+ Join Community'}
            </button>
          )}
          {isOwner && (
            <span style={{
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
              color: '#818cf8', borderRadius: '10px', padding: '10px 16px',
              fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              👑 Creator
            </span>
          )}
          {isOwner && (
            <Link
              to={`/community-settings/${community.id}`}
              className="rbac-manage-btn"
              id="rbacManageBtn"
              title="Open community settings"
              style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#ccc', borderRadius: '10px', padding: '10px 16px', textDecoration: 'none',
                fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              ⚙️ Community Settings
            </Link>
          )}
          {isOwner && (
            <button
              id="rbacDeleteBtn"
              onClick={onDelete}
              style={{
                background: 'rgba(255,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(255,68,68,0.2)',
                borderRadius: '8px', padding: '0 16px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', height: '40px',
              }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
