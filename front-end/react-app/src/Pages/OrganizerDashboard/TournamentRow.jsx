// Table row presentation component for an individual organizer tournament.
import React from 'react';
import StatusBadge from '../../Components/event-management/common/StatusBadge';
import { EVENT_STATUSES } from '../../Components/event-management/utils/constants';

export default function TournamentRow({
  event,
  communityName,
  regCount = 0,
  onEdit,
  onPromote,
  onViewRegistrants,
  onDelete,
}) {
  const isOfflineOnly =
    Number(event.id) > 1000000000 || String(event.id).length > 10;
  const displayCount = isOfflineOnly ? 0 : (regCount ?? event.attendees ?? 0);

  return (
    <tr>
      <td>
        <div className="row-name">
          {event.title}
          {isOfflineOnly && (
            <span
              className="badge"
              style={{
                marginLeft: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '10px',
                padding: '2px 6px',
              }}
            >
              Not synced
            </span>
          )}
        </div>
        <div className="row-sub">
          {event.type || 'tournament'}
          {event.entryFee ? ` · ₹${event.entryFee} entry` : ' · free entry'}
        </div>
      </td>
      <td>{communityName}</td>
      <td>
        {event.date}
        {event.time ? ` · ${event.time}` : ''}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <StatusBadge
            variant="badge"
            status={event.status || EVENT_STATUSES.PENDING}
          />
        </div>
      </td>
      <td>
        {displayCount}
        {event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
      </td>
      <td>
        <div className="btn-row">
          <button
            className="act-btn act-edit"
            onClick={() => onEdit && onEdit(event)}
          >
            Edit
          </button>
          {event.status === EVENT_STATUSES.APPROVED && onPromote && (
            <button
              className="act-btn act-view"
              onClick={() => onPromote(event.id)}
            >
              Promote
            </button>
          )}
          {event.status !== EVENT_STATUSES.REJECTED && (
            <button
              className="act-btn act-view"
              onClick={() => onViewRegistrants && onViewRegistrants(event.id)}
            >
              Registrants
            </button>
          )}
          {/* Only shown when the parent passes onDelete (admin only) */}
          {onDelete && (
            <button
              className="act-btn act-delete"
              onClick={() => onDelete(event.id)}
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
