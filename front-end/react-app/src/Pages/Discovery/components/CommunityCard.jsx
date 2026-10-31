import React from 'react';
import { useNavigate } from 'react-router-dom';
import { memberCountOf, onlineCountOf } from '../../../Components/platform/data/discoveryData';

/**
 * Individual community card: banner, icon, name, stats, tags, and Join/Leave button.
 * CSS classes from discovery.css: c-card, c-banner, c-banner-inner, c-card-body,
 * c-top, c-icon, c-badges, c-badge, c-name, c-cat, c-desc, c-footer, c-stats, c-stat, btn-join.
 */
export default function CommunityCard({ comm, isJoined, onToggleJoin }) {
  const navigate = useNavigate();
  const icon = comm.icon || '🏘️';
  const memberCount = memberCountOf(comm);
  const onlineCount = onlineCountOf(comm);

  // grad from data (e.g. "grad-purple") maps banner background class to "banner-purple"
  const grad = comm.grad || 'grad-purple';
  const bannerClass = grad.replace('grad-', 'banner-');

  // Use the community's own banner when it has one (gradient as-is, image URL
  // in url()). No banner -> no inline style, so the default class colour stays.
  const bannerStyle = comm.banner
    ? {
        backgroundImage: comm.banner.includes('gradient(') ? comm.banner : `url(${comm.banner})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <div
      className="c-card"
      onClick={() => navigate(`/community/${comm.id}`)}
    >
      <div className={`c-banner ${bannerClass}`} style={bannerStyle}>
        <div className="c-banner-inner">{icon}{icon}{icon}</div>
      </div>

      <div className="c-card-body">
        <div className="c-top">
          <div className={`c-icon ${grad}`}>{icon}</div>
          <div className="c-badges">
            {memberCount > 15000 && <span className="c-badge badge-trending">🔥 Trending</span>}
            {onlineCount > 1000  && <span className="c-badge badge-hot">⭐ Hot</span>}
          </div>
        </div>

        <div>
          <div className="c-name">{comm.name}</div>
          <div className="c-cat">
            {comm.category || 'Gaming'}
            {comm.tags?.length ? ` · ${comm.tags.slice(0, 2).join(', ')}` : ''}
          </div>
        </div>

        <div className="c-desc">{comm.description}</div>

        <div className="c-footer">
          <div className="c-stats">
            <span className="c-stat">👥 {memberCount.toLocaleString()}</span>
            <span className="c-stat">🟢 {onlineCount.toLocaleString()} online</span>
          </div>
          <button
            className={`btn-join${isJoined ? ' joined' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleJoin(comm.id, e); }}
          >
            {isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
