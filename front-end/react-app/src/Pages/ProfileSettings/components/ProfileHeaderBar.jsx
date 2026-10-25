import React from 'react';
import { Link } from 'react-router-dom';
import { getHomeRoute } from '../../../services/roleAccess';

/**
 * Top bar — brand, page label, Discard / Save buttons, avatar thumbnail, Logout.
 */
export default function ProfileHeaderBar({
  formData, isDirty, canDiscard, initials, saving,
  onDiscard, onSave, onLogout, userRole
}) {
  return (
    <div className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: '8px', flexShrink: 1 }}>
        <Link to={getHomeRoute(userRole)} className="tb-logo" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', flexShrink: 0 }}>
          <div className="tb-logo-icon">⬡</div>
          <span className="tb-logo-name">Gameunity</span>
        </Link>
        <div className="tb-sep"></div>
        <div className="tb-page" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>⚙️ Profile &amp; Settings</div>
      </div>
      <div className="tb-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'nowrap' }}>
        {/* Discard button — shown always, enabled only when there are unsaved changes */}
        <button
          type="button"
          className="tb-btn"
          onClick={onDiscard}
          disabled={!canDiscard || saving}
          title={canDiscard ? 'Discard all unsaved changes' : 'No changes to discard'}
          style={{
            opacity: canDiscard ? 1 : 0.45,
            cursor: canDiscard ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            width: 'auto',
            minWidth: 'fit-content',
            padding: '0 16px',
            height: '36px',
            lineHeight: '36px',
            boxSizing: 'border-box',
          }}
        >
          ↩ Discard
        </button>
        {/* Save button — pulse animation when dirty */}
        <button
          type="button"
          className={`tb-btn save${isDirty ? ' pulse' : ''}`}
          id="btnSaveAll"
          onClick={onSave}
          disabled={!isDirty || saving}
          title={isDirty ? 'Save all changes' : 'No changes to save'}
          style={{
            whiteSpace: 'nowrap',
            flexShrink: 0,
            width: 'auto',
            minWidth: 'fit-content',
            padding: '0 18px',
            height: '36px',
            lineHeight: '36px',
            boxSizing: 'border-box',
          }}
        >
          {saving ? '⏳ Saving…' : isDirty ? '💾 Save Changes' : 'Save Changes'}
        </button>
        <div
          className="tb-av user-avatar"
          style={{
            backgroundImage: formData.avatar ? `url(${formData.avatar})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            flexShrink: 0,
            width: '34px',
            height: '34px',
            minWidth: '34px',
            minHeight: '34px',
            borderRadius: '50%',
          }}
        >
          {!formData.avatar && initials}
        </div>
        <button
          type="button"
          className="logout-btn"
          onClick={onLogout}
          aria-label="Log out"
          style={{
            whiteSpace: 'nowrap',
            flexShrink: 0,
            height: '36px',
            padding: '0 16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
