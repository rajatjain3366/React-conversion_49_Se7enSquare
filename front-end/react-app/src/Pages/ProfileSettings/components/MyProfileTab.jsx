export default function MyProfileTab({
  formData, initials, onInputChange, onAvatarUpload, onRemovePhoto, avatarPreview,
  isDirty, canDiscard, saving, onSave, onDiscard
}) {
  const bioLen = formData.bio ? formData.bio.length : 0;

  return (
    <div className="view active">
      <div className="settings-card">
        <h2 className="card-title">Public Profile</h2>
        <p className="card-sub" style={{ fontSize: '13px', color: 'var(--text-3, #9ca3af)', marginBottom: '20px' }}>
          This information is displayed publicly on your Gameunity profile and across communities.
        </p>

        <div className="avatar-picker" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          {avatarPreview || formData.avatar ? (
            <img className="av-preview" src={avatarPreview || formData.avatar} alt="Profile preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div className="av-preview" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent, #5b6ef5), var(--accent-2, #8b5cf6))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff' }}>
              {initials}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label className="btn-sm accent" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                📷 Upload Photo
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onAvatarUpload} style={{ display: 'none' }} />
              </label>
              {(avatarPreview || formData.avatar) && (
                <button type="button" className="btn-sm" onClick={onRemovePhoto} style={{ cursor: 'pointer' }}>
                  Remove Photo
                </button>
              )}
            </div>
            <p className="field-hint" style={{ fontSize: '11.5px', color: 'var(--text-3, #6b7280)', margin: 0 }}>
              PNG, JPG, GIF or WEBP, up to 5MB. Photo is saved when you click Save Changes.
            </p>
          </div>
        </div>

        <div className="field-row">
          <label className="field">
            First name
            <input
              name="firstName"
              placeholder="e.g. Alex"
              value={formData.firstName}
              onChange={e => onInputChange('firstName', e.target.value)}
            />
          </label>
          <label className="field">
            Last name
            <input
              name="lastName"
              placeholder="e.g. Mercer"
              value={formData.lastName}
              onChange={e => onInputChange('lastName', e.target.value)}
            />
          </label>
          <label className="field">
            Username
            <input
              name="username"
              placeholder="username"
              value={formData.username}
              onChange={e => onInputChange('username', e.target.value)}
            />
          </label>
        </div>

        <label className="field" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Bio</span>
            <span style={{ fontSize: '11px', color: bioLen > 160 ? '#f87171' : 'var(--text-3, #6b7280)' }}>
              {bioLen} / 160 characters
            </span>
          </div>
          <textarea
            name="bio"
            rows="3"
            placeholder="Tell the community about yourself, favorite games, or platforms..."
            value={formData.bio}
            onChange={e => onInputChange('bio', e.target.value)}
            style={{ width: '100%', minHeight: '80px', marginTop: '6px' }}
          />
        </label>
        <p className="field-hint" style={{ fontSize: '11.5px', color: 'var(--text-3, #6b7280)', marginTop: '4px' }}>
          Optional. Between 5 and 160 characters if provided.
        </p>

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
