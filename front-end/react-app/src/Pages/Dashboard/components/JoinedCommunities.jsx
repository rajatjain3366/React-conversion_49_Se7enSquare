import React from 'react';

/**
 * JoinedCommunities Component
 * Renders two sections:
 *  1. Communities the user has joined (joined by membership, not owned).
 *  2. Communities the user created / owns ("My Communities").
 */
export default function JoinedCommunities({ communities, createdCommunities, loading, navigate }) {
  // Deduplicate: if a community appears in both joined and created, only show it in "My Communities"
  const createdIds = new Set((createdCommunities || []).map((c) => String(c.id)));
  const joinedOnly = (communities || []).filter((c) => !createdIds.has(String(c.id)));

  const CommunityCard = ({ comm }) => {
    const bannerStyle = comm.banner
      ? { backgroundImage: `url(${comm.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' };

    return (
      <div
        className="comm-card"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/community-page?id=${comm.id}`)}
      >
        <div className="comm-card-banner" style={bannerStyle} />
        <div className="comm-card-icon">{comm.icon || '🎮'}</div>
        <div className="comm-card-name" title={comm.name}>{comm.name}</div>
        <div className="comm-card-meta">
          <span>👥 {(comm.members || comm.memberCount || 0).toLocaleString()} members</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ color: 'var(--text-3,#666)', fontSize: '13px', padding: '20px 0' }}>
        Loading communities…
      </div>
    );
  }

  return (
    <div>
      {/* My Communities section (created by this user) */}
      {(createdCommunities || []).length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <div className="section-title">My Communities</div>
            <div
              className="section-link"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/create-community')}
            >
              Create new →
            </div>
          </div>
          <div className="communities-scroll">
            {(createdCommunities || []).map((comm) => (
              <CommunityCard key={comm.id} comm={comm} />
            ))}
          </div>
        </div>
      )}

      {/* Joined Communities section */}
      <div>
        <div className="section-header">
          <div className="section-title">Joined Communities</div>
          <div
            className="section-link"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/discovery')}
          >
            Browse more →
          </div>
        </div>
        <div className="communities-scroll">
          {joinedOnly.length === 0 && (
            <div style={{ color: 'var(--text-3,#888)', fontSize: '13px', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
              No joined communities yet. Explore communities in Discovery!
            </div>
          )}
          {joinedOnly.map((comm) => (
            <CommunityCard key={comm.id} comm={comm} />
          ))}
          <div
            className="comm-card create-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/create-community')}
          >
            <div style={{ fontSize: '24px', color: 'var(--accent)', marginBottom: '4px' }}>+</div>
            <div className="comm-card-name" style={{ marginTop: 0 }}>Create Community</div>
            <div className="comm-card-meta">Start your journey</div>
          </div>
        </div>
      </div>
    </div>
  );
}
