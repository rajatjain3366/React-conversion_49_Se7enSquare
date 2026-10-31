import React from 'react';

const ACTION_STYLES = {
  warn: 'warn',
  mute: 'mute',
  ban_temp: 'ban',
  ban_perm: 'ban',
  dismiss: 'dismiss',
};

const ACTION_ICONS = {
  warn: '⚠️',
  mute: '🔇',
  ban_temp: '⏳',
  ban_perm: '🚫',
  dismiss: '✅',
};

/**
 * Right panel - action buttons, queue stats, and recent actions history.
 */
export default function ModActionPanel({
  selectedReport,
  MOD_ACTIONS,
  processing,
  onTakeAction,
  onMoveToReview,
  onEscalate,
  queueCounts,
  recentActions,
}) {
  // Moderators act only on pending/reviewed reports. Escalated ones belong to
  // the admin, resolved ones are finished.
  const canAct = selectedReport && ['pending', 'reviewed'].includes(selectedReport.status);

  return (
    <div className="mp-action-panel">
      {/* ---- Action Section ---- */}
      {canAct ? (
        <div className="mp-ap-section">
          <div className="mp-ap-section-title">Take Action</div>

          {selectedReport.status === 'pending' && (
            <button
              className="mp-btn-review"
              onClick={() => onMoveToReview(selectedReport.id)}
            >
              🔍 Move to In Review
            </button>
          )}

          <div className="mp-actions-grid">
            {/* The whole action object is passed so the hook knows which sanction to create */}
            {MOD_ACTIONS.map((modAction) => (
              <button
                key={modAction.action}
                className={`mp-act-btn ${ACTION_STYLES[modAction.action] || 'dismiss'}`}
                onClick={() => onTakeAction(modAction, selectedReport)}
                disabled={processing}
                title={modAction.label}
              >
                <span className="mp-act-btn-icon">{ACTION_ICONS[modAction.action] || '⚡'}</span>
                <span>{modAction.label}</span>
              </button>
            ))}
          </div>

          <button
            className="mp-btn-review"
            style={{ marginTop: '10px' }}
            onClick={() => onEscalate(selectedReport)}
            disabled={processing}
          >
            ⬆️ Escalate to Admin
          </button>
        </div>
      ) : (
        <div className="mp-ap-section">
          <div className="mp-ap-section-title">Take Action</div>
          <div style={{ fontSize: '12px', color: '#334155', textAlign: 'center', padding: '12px 0' }}>
            {selectedReport?.status === 'resolved'
              ? '✅ Report is resolved'
              : selectedReport?.status === 'escalated'
              ? '⬆️ Escalated to admin'
              : 'Select a report from the queue'}
          </div>
        </div>
      )}

      {/* ---- Stats Section ---- */}
      <div className="mp-ap-section">
        <div className="mp-ap-section-title">Queue Overview</div>
        <div className="mp-stats-grid">
          <div className="mp-stat-card">
            <div className="mp-stat-val" style={{ color: '#fbbf24' }}>
              {queueCounts.pending || 0}
            </div>
            <div className="mp-stat-label">Pending</div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-val" style={{ color: '#818cf8' }}>
              {queueCounts.reviewed || 0}
            </div>
            <div className="mp-stat-label">Review</div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-val" style={{ color: '#34d399' }}>
              {queueCounts.resolved || 0}
            </div>
            <div className="mp-stat-label">Resolved</div>
          </div>
        </div>
      </div>

      {/* ---- Recent Actions Section ---- */}
      <div className="mp-recent-actions">
        <div className="mp-recent-section-title">Recent Actions</div>

        {recentActions.length === 0 ? (
          <div className="mp-no-actions">No actions recorded yet</div>
        ) : (
          recentActions.map(r => (
            <div key={r.id} className="mp-recent-item">
              <div className="mp-recent-dot" />
              <div className="mp-recent-info">
                <div className="mp-recent-action">{r.action}</div>
                <div className="mp-recent-meta">{r.reportedUser} · {r.ref}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
