import React from 'react';
import { NEXT_STEPS } from '../../../Components/platform/data/appealData';
import { authService } from '../../../services/authService';
import { getHomeRoute } from '../../../services/roleAccess';

/**
 * Appeal page header — back button and breadcrumb.
 */
export function AppealHeader({ navigate }) {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => navigate('/profile-settings')}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#aaa', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Back to Settings
        </button>
        <div className="breadcrumb">
          <span>Platform</span><span className="sep">›</span>
          <span>Account</span><span className="sep">›</span>
          <span className="current">⚖️ Submit Appeal</span>
        </div>
      </div>
      <div className="header-actions">
        <div className="icon-btn">🔔<div className="notif-dot"></div></div>
        <div className="header-avatar user-avatar" />
      </div>
    </header>
  );
}

/**
 * Action details card shown at the top of the appeal form.
 */
export function ActionDetailsCard({ action, user }) {
  if (action) {
    return (
      <div className="action-card" style={{ marginBottom: '20px' }}>
        <div className="action-header">
          <div className="action-severity severity-ban">🚫</div>
          <div className="action-hinfo">
            <div className="action-type">{action.type || 'Moderation Action'}</div>
            <div className="action-community">
              <span>⚡</span> {action.community || 'Platform Enforcement'} · Issued by moderation system
            </div>
          </div>
          <span className="action-badge badge-temp">Active Restriction</span>
        </div>
        <div className="action-details">
          <div className="detail-row">
            <div className="detail-key">Reason on Record</div>
            <div className="detail-val">{action.reason || 'Violation of community policies'}</div>
          </div>
          <div className="detail-row">
            <div className="detail-key">Action ID</div>
            <div className="detail-val mono">{action.id || 'SAN-PENDING'}</div>
          </div>
          {action.until && (
            <div className="detail-row">
              <div className="detail-key">Expires</div>
              <div className="detail-val">{new Date(action.until).toLocaleDateString()}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isRestricted = user?.status && user.status !== 'active';
  if (isRestricted) {
    const isBan = user.status === 'banned';
    return (
      <div className="action-card" style={{ marginBottom: '20px' }}>
        <div className="action-header">
          <div className="action-severity severity-ban">⚠️</div>
          <div className="action-hinfo">
            <div className="action-type">{isBan ? 'Account Ban' : 'Account Suspension'}</div>
            <div className="action-community">
              <span>🛡️</span> Gameunity Trust &amp; Safety · Status: {user.status.toUpperCase()}
            </div>
          </div>
          <span className="action-badge badge-temp" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
            {user.status.toUpperCase()}
          </span>
        </div>
        <div className="action-details">
          <div className="detail-row">
            <div className="detail-key">Account Status Reason</div>
            <div className="detail-val">{user.statusReason || 'Violation of community standards and guidelines'}</div>
          </div>
          <div className="detail-row">
            <div className="detail-key">Account Username</div>
            <div className="detail-val mono">@{user.username || 'user'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="action-card" style={{ marginBottom: '20px' }}>
      <div className="action-header">
        <div className="action-severity" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>✓</div>
        <div className="action-hinfo">
          <div className="action-type">Account Standing: Good Standing</div>
          <div className="action-community"><span>🛡️</span> Gameunity Community Integrity</div>
        </div>
        <span className="action-badge badge-temp" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
          Active Account
        </span>
      </div>
      <div className="action-details">
        <div className="detail-row">
          <div className="detail-key">Status Note</div>
          <div className="detail-val">
            Your account currently has no active bans or suspensions. You can use this form to contest specific warnings, mutes, content removals, or report decisions.
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Review Window</div>
          <div className="detail-val">Appeals are reviewed by administrators within 24–48 hours.</div>
        </div>
      </div>
    </div>
  );
}

/**
 * The appeal form — reason selector, statement, commitment, warning notice, submit.
 */
export function AppealForm({
  APPEAL_TYPES,
  appealType, onAppealTypeChange,
  statement, onStatementChange,
  commitment, onCommitmentChange,
  errors, submitting,
  onSubmit, onCancel,
}) {
  return (
    <form className="appeal-form" onSubmit={onSubmit}>
      <div className="form-section-title">Your Appeal</div>

      <div className="field">
        <label>Appeal Reason *</label>
        <div className="reason-list">
          {APPEAL_TYPES.map(t => (
            <div
              key={t.id}
              className={`reason-opt${appealType === t.id ? ' selected' : ''}`}
              onClick={() => onAppealTypeChange(t.id)}
            >
              <div className="reason-radio"></div>
              <div className="reason-body">
                <div className="reason-title">{t.label}</div>
                <div className="reason-desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
        {errors.type && <div className="error-msg">{errors.type}</div>}
      </div>

      <div className="field">
        <label>Your Statement *</label>
        <textarea
          rows={5} maxLength={1000}
          placeholder="Explain your side of the story in detail…"
          value={statement}
          onChange={e => onStatementChange(e.target.value)}
        />
        <div className="char-count">{statement.length}/1000</div>
        {errors.statement && <div className="error-msg">{errors.statement}</div>}
      </div>

      <div className="field">
        <label>Commitment to Community (Optional)</label>
        <textarea
          rows={3} maxLength={500}
          placeholder="If your appeal is approved, how do you plan to contribute positively…"
          value={commitment}
          onChange={e => onCommitmentChange(e.target.value)}
        />
        <div className="char-count">{commitment.length}/500</div>
      </div>

      <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '20px', fontSize: '13px', color: '#d97706', lineHeight: '1.5' }}>
        ⚠️ <strong>Important:</strong> Submitting a false appeal is a violation of Gameunity's Terms of Service and may result in additional moderation actions.
      </div>

      {/* Real error from submitting (not logged in, or backend rejected it) */}
      {errors.submit && <div className="error-msg" style={{ marginBottom: '12px' }}>{errors.submit}</div>}

      <div className="form-actions">
        <button type="button" className="btn-back" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-next" disabled={submitting}>
          {submitting ? 'Submitting…' : '⚖️ Submit Appeal'}
        </button>
      </div>
    </form>
  );
}

/**
 * Appeal sidebar — "What Happens Next" steps and previous appeals list.
 */
export function AppealSidebar({ myAppeals }) {
  return (
    <div className="appeal-sidebar">
      <div className="sidebar-card">
        <div className="sc-title">📋 What Happens Next</div>
        <div className="timeline">
          {NEXT_STEPS.map((step, i) => (
            <div key={i} className="tl-item">
              <div className="tl-dot" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                {step.icon}
              </div>
              <div className="tl-info">
                <div className="tl-event" style={{ fontWeight: 600 }}>{step.label}</div>
                <div className="tl-time">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {myAppeals.length > 0 && (
        <div className="sidebar-card" style={{ marginTop: '16px' }}>
          <div className="sc-title">📜 Previous Appeals</div>
          {myAppeals.map((ap, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border,rgba(255,255,255,0.05))' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{ap.appealType || 'Appeal'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3,#666)', marginTop: '3px' }}>{ap.status || 'Pending'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Success screen shown after a successful appeal submission.
 */
export function AppealSuccess({ refId, navigate, onReset }) {
  return (
    <div className="main">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/profile-settings')} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#aaa', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
            ← Back to Settings
          </button>
          <div className="breadcrumb">
            <span>Account</span><span className="sep">›</span>
            <span className="current">⚖️ Submit Appeal</span>
          </div>
        </div>
      </header>
      <div className="page-wrap" style={{ display: 'flex', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>✓</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Appeal Submitted</div>
          <div style={{ fontSize: '14px', color: 'var(--text-3,#9ca3af)', lineHeight: '1.6', marginBottom: '16px' }}>
            Your appeal has been received and will be reviewed within <strong style={{ color: '#fff' }}>48–72 hours</strong>.
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginBottom: '24px' }}>
            Reference ID: <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{refId}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => navigate(getHomeRoute(authService.getCurrentUser()?.role))} style={{ padding: '10px 20px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Return to Home</button>
            <button onClick={onReset} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}>Submit Another Appeal</button>
          </div>
        </div>
      </div>
    </div>
  );
}
