// Banner showcasing the top featured upcoming event.
import React from 'react';

const EVENT_COVERS = {
  tournament: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop',
  hackathon: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop',
  workshop: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop',
  casual: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop',
};

export default function FeaturedEventBanner({
  event,
  comm,
  isRegistered = false,
  onView,
  onRegister,
}) {
  if (!event) return null;

  const typeKey = (event.type || 'tournament').toLowerCase();
  const coverImg = event.banner || event.image || EVENT_COVERS[typeKey] || EVENT_COVERS.default;
  const attendees = event.attendees ?? event.registered ?? 0;
  const capacity = event.maxAttendees || event.capacity || null;
  const isFull = Boolean(capacity && attendees >= capacity);
  const percentFull = capacity ? Math.min(100, Math.round((attendees / capacity) * 100)) : 35;
  const seatsLabel = capacity
    ? `⚡ ${capacity - attendees} seats left`
    : 'Open registration';

  let formattedDate = 'Upcoming';
  if (event.date) {
    const d = new Date(event.date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } else {
      formattedDate = event.date;
    }
  }

  return (
    <div className="feat-card-container">
      <div className="feat-ambient-glow" />

      {/* Hero poster image */}
      <div className="feat-poster-box">
        <img
          src={coverImg}
          alt={event.title}
          className="feat-poster-img"
        />
        <div className="feat-poster-gradient" />
        <div className="feat-badge-cluster">
          <span className="ev-badge badge-featured">🏆 FEATURED</span>
          <span className={`ev-badge badge-${typeKey}`}>{event.type || 'Tournament'}</span>
        </div>
      </div>

      {/* Main details */}
      <div className="feat-details-box">
        <div className="feat-top-meta">
          <div className="feat-comm-pill">
            <span className="feat-comm-icon">{comm?.icon || '🎮'}</span>
            <span className="feat-comm-title">{comm?.name || 'Community'}</span>
          </div>
          <div className="feat-date-pill">
            <span className="feat-date-icon">📅</span>
            <span>{formattedDate} {event.time ? `· ${event.time}` : ''}</span>
          </div>
        </div>

        <h2 className="feat-hero-title">{event.title}</h2>
        <p className="feat-hero-desc">
          {event.description ||
            'Join this featured event and compete with players across the community.'}
        </p>

        <div className="feat-pills-row">
          <div className="feat-stat-pill">
            <span className="feat-stat-icon">⏰</span>
            <span>{event.time || 'TBD'}</span>
          </div>
          <div className="feat-stat-pill">
            <span className="feat-stat-icon">📍</span>
            <span>{event.location || event.mode || 'Online Event'}</span>
          </div>
          <div className="feat-stat-pill">
            <span className="feat-stat-icon">👥</span>
            <span>{attendees} / {capacity || '∞'} Players</span>
          </div>
        </div>
      </div>

      {/* Side Action Box */}
      <div className="feat-side-actions">
        <div className="feat-capacity-card">
          <div className="feat-capacity-header">
            <span className="feat-capacity-label">Registration</span>
            <span className="feat-capacity-val">{isFull ? '100%' : `${percentFull}%`}</span>
          </div>
          <div className="feat-capacity-bar">
            <div
              className={`feat-capacity-fill${isFull ? ' full' : ''}`}
              style={{ width: `${percentFull}%` }}
            />
          </div>
          <div className="feat-seats-text">
            {isFull ? '🚫 Event is at full capacity' : seatsLabel}
          </div>
        </div>

        <div className="feat-btn-stack">
          <button
            type="button"
            className={`btn-feat-primary${isRegistered ? ' registered' : ''}`}
            onClick={() => {
              if (!isRegistered && onRegister) onRegister(event);
            }}
            disabled={isRegistered || isFull}
          >
            {isRegistered ? '✓ Registered' : isFull ? 'Event Full' : 'Register Now'}
          </button>
          <button
            type="button"
            className="btn-feat-secondary"
            onClick={() => onView && onView(event)}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
