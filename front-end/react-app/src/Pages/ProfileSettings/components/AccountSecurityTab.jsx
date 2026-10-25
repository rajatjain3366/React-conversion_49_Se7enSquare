import React from 'react';

export default function AccountSecurityTab({
  formData,
  user,
  onInputChange,
  passwords,
  setPasswords,
  showPassword,
  setShowPassword,
  isDirty,
  canDiscard,
  saving,
  onSave,
  onDiscard,
  onChangePassword,
}) {
  const hasPasswordInput = Boolean(passwords.new || passwords.current || passwords.confirm);

  return (
    <div className="view active">
      {/* Account Details Card */}
      <div className="settings-card" style={{ marginBottom: '24px' }}>
        <h2 className="card-title">Account Details</h2>
        <p className="card-sub" style={{ fontSize: '13px', color: 'var(--text-3, #9ca3af)', marginBottom: '20px' }}>
          Manage your verified contact information used for sign-in and security notifications.
        </p>

        <div className="field-row">
          <label className="field">
            Email address
            <input
              name="email"
              type="email"
              value={formData.email}
              disabled={Boolean(user.googleId)}
              onChange={e => onInputChange('email', e.target.value)}
              placeholder="you@example.com"
            />
            {user.googleId && (
              <span className="field-hint" style={{ color: 'var(--text-3, #6b7280)', fontSize: '11px', marginTop: '4px' }}>
                Managed via Google OAuth. Cannot be edited here.
              </span>
            )}
          </label>
          <label className="field">
            Phone number
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={e => onInputChange('phone', e.target.value)}
              placeholder="+91 98765 43210"
            />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border, rgba(255,255,255,0.06))' }}>
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

      {/* Password Management Card */}
      <div className="settings-card">
        <h2 className="card-title">{user.hasPassword ? 'Change Password' : 'Set Account Password'}</h2>
        <p className="card-sub" style={{ fontSize: '13px', color: 'var(--text-3, #9ca3af)', marginBottom: '16px' }}>
          Use at least 8 characters with a mix of letters and numbers.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '440px' }}>
          {user.hasPassword && (
            <label className="field">
              <span>Current Password</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '6px' }}>
                <input
                  name="current"
                  type={showPassword.current ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  value={passwords.current}
                  onChange={e => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  style={{ width: '100%', paddingRight: '70px' }}
                />
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                  style={{ position: 'absolute', right: '6px', padding: '4px 8px', fontSize: '11px', background: 'transparent' }}
                >
                  {showPassword.current ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
          )}

          <label className="field">
            <span>New Password</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '6px' }}>
              <input
                name="new"
                type={showPassword.new ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters (letters + numbers)"
                value={passwords.new}
                onChange={e => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                style={{ width: '100%', paddingRight: '70px' }}
              />
              <button
                type="button"
                className="btn-sm"
                onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                style={{ position: 'absolute', right: '6px', padding: '4px 8px', fontSize: '11px', background: 'transparent' }}
              >
                {showPassword.new ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label className="field">
            <span>Confirm New Password</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '6px' }}>
              <input
                name="confirm"
                type={showPassword.confirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-type new password"
                value={passwords.confirm}
                onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                style={{ width: '100%', paddingRight: '70px' }}
              />
              <button
                type="button"
                className="btn-sm"
                onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                style={{ position: 'absolute', right: '6px', padding: '4px 8px', fontSize: '11px', background: 'transparent' }}
              >
                {showPassword.confirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="tb-btn save"
              onClick={onChangePassword}
              disabled={!hasPasswordInput || saving}
              style={{
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 600,
                opacity: hasPasswordInput && !saving ? 1 : 0.5,
                cursor: hasPasswordInput && !saving ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? '⏳ Updating…' : '🔑 Update Password'}
            </button>
            {hasPasswordInput && (
              <button
                type="button"
                className="tb-btn"
                onClick={() => setPasswords({ current: '', new: '', confirm: '' })}
                style={{ padding: '8px 14px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
