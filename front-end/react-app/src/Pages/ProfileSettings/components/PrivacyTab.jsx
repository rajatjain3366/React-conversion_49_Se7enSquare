import React from 'react';

const PRIVACY_TOGGLES = [
  { key: 'showEmail', label: 'Show email on my profile', hint: 'Other users can see your email address on your public profile.' },
  { key: 'showPhone', label: 'Show phone number on profile', hint: 'Your phone number will be visible to community members.' },
  { key: 'showActivity', label: 'Show my posts in profile activity', hint: 'Your recent posts and activity will appear on your profile page.' },
  { key: 'appearInSearch', label: 'Appear in user search & directory', hint: 'Other users can find you by searching your username or name.' },
];

export default function PrivacyTab({
  privacy,
  setPrivacy,
  isDirty,
  canDiscard,
  saving,
  onSave,
  onDiscard,
}) {
  return (
    <div className="view active">
      <div className="settings-card">
        <h2 className="card-title">Profile Privacy</h2>
        <p className="card-sub" style={{ fontSize: '13px', color: 'var(--text-3, #9ca3af)', marginBottom: '24px' }}>
          Control who can view your profile information and send you direct messages. Administrators and moderators reviewing reports always have required access.
        </p>

        {/* Selectors grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          {/* Profile Visibility Selector */}
          <label className="field">
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-1, #eef0f8)', display: 'block', marginBottom: '6px' }}>
              Profile Visibility
            </span>
            <select
              value={privacy.profileVisibility || 'public'}
              onChange={e => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card, #111118)', color: '#fff', border: '1px solid var(--border, rgba(255,255,255,0.1))' }}
            >
              <option value="public">🌍 Public — Anyone can view your profile</option>
              <option value="members">👥 Community Members — Shared members only</option>
              <option value="private">🔒 Private — Only you can see your profile</option>
            </select>
            <p className="field-hint" style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--text-3, #6b7280)' }}>
              Controls overall visibility of your profile page details.
            </p>
          </label>

          {/* Who Can Message You */}
          <label className="field">
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-1, #eef0f8)', display: 'block', marginBottom: '6px' }}>
              Direct Messages
            </span>
            <select
              value={privacy.whoCanMessage || 'nobody'}
              onChange={e => setPrivacy(prev => ({ ...prev, whoCanMessage: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card, #111118)', color: '#fff', border: '1px solid var(--border, rgba(255,255,255,0.1))' }}
            >
              <option value="everyone">💬 Everyone — Anyone can message you</option>
              <option value="members">👥 Community Members — Shared community members only</option>
              <option value="nobody">🚫 Nobody — Direct messages disabled</option>
            </select>
            <p className="field-hint" style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--text-3, #6b7280)' }}>
              Determines who can initiate 1-on-1 direct conversations with you.
            </p>
          </label>
        </div>

        {/* Granular Toggles Header */}
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1, #eef0f8)', marginBottom: '14px' }}>
          Information Display & Discovery
        </h3>

        {/* Toggle rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PRIVACY_TOGGLES.map(({ key, label, hint }) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.025)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1, #eef0f8)', marginBottom: '2px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3, #6b7280)', lineHeight: 1.4 }}>{hint}</div>
              </div>
              {/* Toggle switch */}
              <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(privacy[key])}
                  onChange={e => setPrivacy(prev => ({ ...prev, [key]: e.target.checked }))}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <div
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: privacy[key] ? 'var(--accent, #5b6ef5)' : 'rgba(255,255,255,0.12)',
                    transition: 'background 0.2s',
                    position: 'relative',
                    boxShadow: privacy[key] ? '0 0 10px rgba(91,110,245,0.45)' : 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: privacy[key] ? '23px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* In-Card Save & Discard Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--border, rgba(255,255,255,0.06))' }}>
          <button
            type="button"
            className="tb-btn"
            onClick={onDiscard}
            disabled={!canDiscard || saving}
            style={{
              opacity: canDiscard ? 1 : 0.45,
              cursor: canDiscard ? 'pointer' : 'not-allowed',
              padding: '8px 16px',
            }}
          >
            ↩ Discard
          </button>
          <button
            type="button"
            className={`tb-btn save${isDirty ? ' pulse' : ''}`}
            onClick={onSave}
            disabled={!isDirty || saving}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? '⏳ Saving…' : isDirty ? '💾 Save Changes' : '✓ Saved'}
          </button>
        </div>
      </div>
    </div>
  );
}
