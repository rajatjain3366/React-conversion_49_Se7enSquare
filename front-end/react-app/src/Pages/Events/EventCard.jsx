// Card presentation component for an upcoming event.
import React from 'react';

const EVENT_COVERS = {
  tournament: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop',
  hackathon: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop',
  workshop: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop',
  casual: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop',
};

export default function EventCard({
  event,
  index = 0,
  comm,
  isRegistered = false,
  onView,
  onRegister,
  onCancel,
  canDelete = false,
  onDelete,
}) {
  const typeKey = (event.type || 'tournament').toLowerCase();
  const coverUrl = event.banner || event.image || EVENT_COVERS[typeKey] || EVENT_COVERS.default;

  const dateObj = event.date ? new Date(event.date) : null;
  const month =
    dateObj && !isNaN(dateObj)
      ? dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      : 'TBD';
  const day =
    dateObj && !isNaN(dateObj)
      ? dateObj.getDate().toString().padStart(2, '0')
      : '--';
  const attendees = event.attendees ?? event.registered ?? 0;
  const capacity = event.maxAttendees || event.capacity || null;
  const isFull = Boolean(capacity && attendees >= capacity);
  const seatsLabel = capacity
    ? `⚡ ${capacity - attendees} seats left`
    : 'Open registration';

  return (
    <div
      className={`ev-card delay-${(index % 10) * 5}`}
      onClick={() => onView && onView(event)}
    >
      <div className="ev-card-banner">
        <img
          src={coverUrl}
          alt={event.title}
          className="ev-card-banner-img"
          loading="lazy"
        />
        <div className="ev-card-banner-overlay" />
        <div className="ev-card-badges">
          <span className={`ev-badge badge-${typeKey}`}>{event.type || 'Event'}</span>
          {event.free && <span className="ev-badge badge-free">🆓 Free</span>}
        </div>
      </div>
      <div className="ev-card-body">
        <div className="ev-card-top">
          <div className="ev-date-box">
            <div className="ev-date-mon">{month}</div>
            <div className="ev-date-day">{day}</div>
          </div>
          <div className="ev-card-title-group">
            <h3 className="ev-card-title">{event.title}</h3>
            <div className="ev-card-comm">
              <span className="ev-comm-av">{comm?.icon || '🎮'}</span>
              <span className="ev-comm-name">{comm?.name || 'General Community'}</span>
            </div>
          </div>
        </div>

        {event.description && (
          <p className="ev-card-desc">{event.description}</p>
        )}

        <div className="ev-card-meta">
          <div className="ev-meta-tag">
            <span>⏰</span>
            <span>{event.time || 'TBD'}</span>
          </div>
          <div className="ev-meta-tag">
            <span>👤</span>
            <span>{attendees} / {capacity || '∞'}</span>
          </div>
          <div className="ev-meta-tag">
            <span>📍</span>
            <span>{event.mode || event.type || 'Online'}</span>
          </div>
        </div>

        <div className="ev-card-footer">
          <div className={`ev-attendees${isFull ? ' full' : ''}`}>
            <span className="ev-seats-dot" />
            <span>{isFull ? 'Event Full' : seatsLabel}</span>
          </div>
          <div className="ev-actions">
            <button
              type="button"
              className="btn-ev"
              onClick={(e) => {
                e.stopPropagation();
                if (onView) onView(event);
              }}
            >
              View
            </button>
            <button
              type="button"
              className={`btn-register${isRegistered ? ' registered' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isRegistered && onCancel) {
                  onCancel(event);
                } else if (!isFull && onRegister) {
                  onRegister(event);
                }
              }}
              disabled={isFull && !isRegistered}
            >
              {isRegistered ? '✓ Registered' : isFull ? 'Full' : 'Register'}
            </button>
            {canDelete && onDelete && (
              <button
                type="button"
                className="btn-delete-event"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(event.id);
                }}
                title="Delete Event"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
