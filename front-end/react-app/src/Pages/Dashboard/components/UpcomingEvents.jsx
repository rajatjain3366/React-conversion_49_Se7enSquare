import React from 'react';

/**
 * UpcomingEvents Component
 * Renders upcoming community events with quick navigation to events schedule.
 */
export default function UpcomingEvents({ events = [], navigate }) {
  const parseDate = (dateStr) => {
    if (!dateStr) return { mon: 'UP', day: '••' };
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return {
        mon: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: String(d.getDate()).padStart(2, '0'),
      };
    }
    const parts = String(dateStr).split(' ');
    return {
      mon: (parts[0] || 'EV').slice(0, 3).toUpperCase(),
      day: parts[1] || '••',
    };
  };

  return (
    <div className="section-box">
      <div className="section-header">
        <div className="section-title">📅 Upcoming Events</div>
        <div className="section-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/events')}>
          View all →
        </div>
      </div>
      <div className="event-list">
        {events.length === 0 ? (
          <div className="dash-empty-state">
            <span className="dash-empty-icon">🎮</span>
            <div className="dash-empty-title">No upcoming events</div>
            <div className="dash-empty-desc">Tournaments and community nights you join will appear here.</div>
          </div>
        ) : (
          events.map((ev) => {
            const { mon, day } = parseDate(ev.date);
            return (
              <div
                key={ev.id}
                className="dash-event-card"
                onClick={() => navigate('/events')}
              >
                <div className="dash-event-date">
                  <span className="dash-event-mon">{mon}</span>
                  <span className="dash-event-day">{day}</span>
                </div>
                <div className="dash-event-info">
                  <div className="dash-event-title">{ev.title}</div>
                  <div className="dash-event-meta">
                    <span className="dash-event-comm">{ev.community}</span>
                    {ev.time && <span className="dash-event-time">· {ev.time}</span>}
                  </div>
                </div>
                <div className="dash-event-arrow">→</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
