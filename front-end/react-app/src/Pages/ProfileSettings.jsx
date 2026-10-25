import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/profile-settings.css';
import useProfileSettings from '../Components/platform/hooks/useProfileSettings';
import ProfileHeaderBar from './ProfileSettings/components/ProfileHeaderBar';
import ProfileNav from './ProfileSettings/components/ProfileNav';
import MyProfileTab from './ProfileSettings/components/MyProfileTab';
import AccountSecurityTab from './ProfileSettings/components/AccountSecurityTab';
import MembershipTab from './ProfileSettings/components/MembershipTab';
import PrivacyTab from './ProfileSettings/components/PrivacyTab';
import DangerZoneTab from './ProfileSettings/components/DangerZoneTab';

export default function ProfileSettings() {
  const p = useProfileSettings();
  return <div className="app-shell"><SideBar /><div className="main-column-wrapper">
    <ProfileHeaderBar formData={p.formData} isDirty={p.isDirty} canDiscard={p.canDiscard} saving={p.saving || p.loading} initials={p.initials} onDiscard={p.discardChanges} onSave={p.saveAllChanges} onLogout={p.handleLogout} userRole={p.user?.role} />
    {p.loading ? <p role="status">Loading your profile…</p> : <div className="body-wrap">
      {p.user && <ProfileNav formData={p.formData} initials={p.initials} activeTab={p.activeTab} onSelectTab={p.setActiveTab} userRole={p.user?.role} />}
      <div className="main">
        {p.user?.status && p.user.status !== 'active' && (
          <div
            className="card"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>
                  Account {p.user.status === 'banned' ? 'Banned' : 'Suspended'}
                </div>
                <div style={{ fontSize: '13px', marginTop: '2px', color: '#fca5a5' }}>
                  Reason: {p.user.statusReason || 'Violation of community policies'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => p.navigate('/appeal')}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Appeal →
            </button>
          </div>
        )}
        {p.errors.length > 0 && (
          <div
            role="alert"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '18px',
              fontSize: '13px',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>⚠️ Please correct the following:</div>
            <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
              {p.errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        )}
        {p.toastMsg && (
          <div
            role="status"
            style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              color: '#4ade80',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '18px',
              fontSize: '13.5px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{p.toastMsg}</span>
            <button
              type="button"
              onClick={() => p.showToast('')}
              style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
        )}
        {p.user && (
          <fieldset className="profile-fields" disabled={p.saving} style={{ border: 'none', padding: 0, margin: 0 }}>
            {p.activeTab === 'profile' && (
              <MyProfileTab
                formData={p.formData}
                initials={p.initials}
                avatarPreview={p.avatarPreview}
                onInputChange={p.handleInputChange}
                onAvatarUpload={p.handleAvatarUpload}
                onRemovePhoto={p.removePhoto}
                isDirty={p.isDirty}
                canDiscard={p.canDiscard}
                saving={p.saving}
                onSave={p.saveAllChanges}
                onDiscard={p.discardChanges}
              />
            )}
            {p.activeTab === 'account' && (
              <AccountSecurityTab
                user={p.user}
                formData={p.formData}
                onInputChange={p.handleInputChange}
                passwords={p.passwords}
                setPasswords={p.setPasswords}
                showPassword={p.showPassword}
                setShowPassword={p.setShowPassword}
                isDirty={p.isDirty}
                canDiscard={p.canDiscard}
                saving={p.saving}
                onSave={p.saveAllChanges}
                onDiscard={p.discardChanges}
                onChangePassword={p.changeUserPassword}
              />
            )}
            {p.activeTab === 'privacy' && (
              <PrivacyTab
                privacy={p.privacy}
                setPrivacy={p.setPrivacy}
                isDirty={p.isDirty}
                canDiscard={p.canDiscard}
                saving={p.saving}
                onSave={p.saveAllChanges}
                onDiscard={p.discardChanges}
              />
            )}
            {p.activeTab === 'membership' && <MembershipTab p={p} />}
            {p.activeTab === 'danger' && <DangerZoneTab navigate={p.navigate} onShowToast={p.showToast} onLogout={p.handleLogout} />}
          </fieldset>
        )}
      </div>
    </div>}
  </div></div>;
}
