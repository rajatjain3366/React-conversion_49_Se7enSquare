import React from 'react';

const TYPE_ICONS = {
  message: '💬',
  user: '👤',
};

/**
 * Center panel - modern report detail view with glassmorphism cards.
 */
export default function ReportDetailView({ selectedReport, actionNote, onActionNoteChange }) {
  if (!selectedReport) {
    return (
      <div className="mp-detail-panel">
        <div className="mp-detail-empty">
          <div className="mp-detail-empty-icon">📋</div>
          <div className="mp-detail-empty-text">Select a report to review</div>
        </div>
      </div>
    );
  }

  const statusClass = `status-${selectedReport.status}`;

  return (
    <div className="mp-detail-panel">
      {/* Header */}
      <div className="mp-dp-header">
        <div className="mp-dp-top">
          <div className="mp-dp-title" id="dpTitle">
            {selectedReport.ref} — {selectedReport.reportedUser}
          </div>
          <span className={`mp-dp-status-badge ${statusClass}`} id="dpAction">
            {selectedReport.status?.charAt(0).toUpperCase() + selectedReport.status?.slice(1)}
          </span>
        </div>
        <div className="mp-dp-meta">
          <span className="mp-dp-meta-item">
            📍 <strong>{selectedReport.channel || '#general'}</strong>
          </span>
          <span className="mp-dp-meta-item">
            🏷️ <strong>{selectedReport.type === 'message' ? 'Message Report' : 'User Report'}</strong>
          </span>
          {selectedReport.action && (
            <span className="mp-dp-meta-item">
              ⚡ <strong>Last action: {selectedReport.action}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mp-dp-body" id="tabContent">
        {/* Reporter Info */}
        <div className="mp-reporter-card">
          <div className="mp-reporter-av">AM</div>
          <div className="mp-reporter-info">
            <div className="mp-reporter-name">Reported by: Anonymous</div>
            <div className="mp-reporter-sub">
              {selectedReport.date} · via {selectedReport.type === 'message' ? 'Message' : 'Profile'} Report
            </div>
          </div>
          <span className="mp-anon-badge">🔒 Anonymous</span>
        </div>

        {/* Reason Card */}
        <div className="mp-reason-card">
          <div className="mp-rc-header">
            <span className="mp-rc-icon">{TYPE_ICONS[selectedReport.type] || '⚠️'}</span>
            <span className="mp-rc-title">{selectedReport.reason}</span>
          </div>
          <div className="mp-rc-desc">
            {selectedReport.type === 'message'
              ? 'This message was flagged as violating community guidelines.'
              : 'This user\'s behavior was flagged as violating community standards.'}
          </div>
          {selectedReport.context && (
            <div className="mp-rc-context">
              "{selectedReport.context}"
            </div>
          )}
        </div>

        {/* Moderator Note */}
        {selectedReport.status !== 'resolved' && (
          <div className="mp-note-section">
            <span className="mp-note-label">Moderator Note (Optional)</span>
            <textarea
              className="mp-note-textarea"
              rows={3}
              placeholder="Add a note explaining your moderation action…"
              value={actionNote}
              onChange={e => onActionNoteChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Resolved Banner */}
      {selectedReport.status === 'resolved' && (
        <div className="mp-resolved-banner">
          <span className="mp-resolved-icon">✅</span>
          <div className="mp-resolved-info">
            <h4>Report Resolved</h4>
            <p>{selectedReport.action ? `Action taken: ${selectedReport.action}` : 'This report has been closed.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
