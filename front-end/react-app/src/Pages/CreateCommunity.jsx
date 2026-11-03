import React from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import useCreateCommunity from '../Components/platform/hooks/useCreateCommunity';
import { WIZARD_STEPS } from '../Components/platform/data/createCommunityOptions';
import CreateCommunityHeader from './CreateCommunity/components/CreateCommunityHeader';
import BasicInfoFields from './CreateCommunity/components/BasicInfoFields';
import BrandingPicker from './CreateCommunity/components/BrandingPicker';
import PrivacyTypeSelector from './CreateCommunity/components/PrivacyTypeSelector';
import CommunityRulesInput from './CreateCommunity/components/CommunityRulesInput';
import CreateCommunityActions from './CreateCommunity/components/CreateCommunityActions';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/create-community.css';

/**
 * CreateCommunity Page — thin orchestrator.
 * All state, validation, submission guard, and channel CRUD lives in useCreateCommunity().
 */
export default function CreateCommunity() {
  const navigate = useNavigate();
  const hook = useCreateCommunity(navigate);

  return (
    <div className="app-shell">
      <SideBar />
      <div className="main">
        <CreateCommunityHeader activeTab={hook.activeTab} currentStep={hook.currentStep} />

        <div className="body">
          {/* Steps Panel / Live Preview */}
          <div className="steps-panel">
            {hook.activeTab === 'community' && (
              <>
                <div className="steps-title">Progress</div>
                {WIZARD_STEPS.map((s) => (
                  <div
                    key={s.step}
                    className={`step ${hook.currentStep === s.step ? 'on' : ''}`}
                    onClick={() => {
                      if (s.step < hook.currentStep || hook.validateStep(hook.currentStep)) {
                        hook.setCurrentStep(s.step);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="step-num">{s.step}</div>
                    <div className="step-info">
                      <div className="step-lbl">{s.title}</div>
                      <div className="step-sub">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Live Preview */}
            <div className="preview-card" style={{ marginTop: '24px' }}>
              <div className="pc-label">Live Preview</div>
              <div className="pc-banner" style={{ background: hook.banner }}></div>
              <div className="pc-av">{hook.icon}</div>
              <div className="pc-info">
                <div className="pc-name">{hook.name || 'Your Community'}</div>
                <div className="pc-meta">{hook.category} · 1 member</div>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="form-area">
            {/* Tab switcher: Community / Channel */}
            <div className="subpage-tabs">
              <div
                className={`spt ${hook.activeTab === 'community' ? 'on' : ''}`}
                onClick={() => { hook.setActiveTab('community'); hook.setCurrentStep(1); }}
              >
                🏘 Community
              </div>
              <div
                className={`spt ${hook.activeTab === 'channel' ? 'on' : ''}`}
                onClick={() => hook.setActiveTab('channel')}
              >
                💬 Channel
              </div>
            </div>

            {/* Community Wizard Steps */}
            {hook.activeTab === 'community' && (
              <div className="fview on">
                {hook.currentStep === 1 && (
                  <BasicInfoFields
                    name={hook.name} desc={hook.desc} slug={hook.slug} category={hook.category}
                    onNameChange={hook.handleNameChange} onDescChange={hook.setDesc}
                    onSlugChange={hook.setSlug} onCategoryChange={hook.setCategory}
                  />
                )}
                {hook.currentStep === 2 && (
                  <BrandingPicker
                    icon={hook.icon} banner={hook.banner} tags={hook.tags} website={hook.website}
                    onIconChange={hook.setIcon} onBannerChange={hook.setBanner}
                    onTagsChange={hook.setTags} onWebsiteChange={hook.setWebsite}
                  />
                )}
                {hook.currentStep === 3 && (
                  <div>
                    <div className="section-title">Channels</div>
                    <div className="section-sub">Set up the channels your members will use to communicate.</div>
                    <div className="ch-list">
                      {hook.channels.map((ch) => (
                        <div key={ch.id} className="ch-item">
                          <div className="ch-ico">{ch.icon || '💬'}</div>
                          <div className="ch-info">
                            <div className="ch-name">#{ch.name}</div>
                            <div className="ch-desc">{ch.desc}</div>
                          </div>
                          <span className="ch-type">{ch.type}</span>
                          <span className="ch-del" onClick={() => hook.handleDeleteChannel(ch.id)} style={{ cursor: 'pointer' }}>✕</span>
                        </div>
                      ))}
                    </div>
                    {hook.showAddCh ? (
                      <div className="ch-form" style={{ marginTop: '16px' }}>
                        <div className="f-label">New Channel</div>
                        <div className="ch-type-picker" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          {['Text', 'Voice', 'Announcement', 'Forum'].map((t) => (
                            <button key={t} type="button" className={`ctp ${hook.newChType === t ? 'on' : ''}`} onClick={() => hook.setNewChType(t)}>{t}</button>
                          ))}
                        </div>
                        <div className="ch-form-row">
                          <div>
                            <div className="f-label">Channel Name *</div>
                            <input className="f-in" value={hook.newChName} onChange={(e) => hook.setNewChName(e.target.value)} placeholder="e.g. clips-and-highlights" />
                          </div>
                          <div>
                            <div className="f-label">Description</div>
                            <input className="f-in" value={hook.newChDesc} onChange={(e) => hook.setNewChDesc(e.target.value)} placeholder="What is this channel for?" />
                          </div>
                        </div>
                        <div className="ch-form-acts" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <button className="btn-sm btn-sm-g" onClick={() => hook.setShowAddCh(false)}>Cancel</button>
                          <button className="btn-sm btn-sm-p" onClick={hook.handleAddChannel}>Add Channel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="add-ch-btn" onClick={() => hook.setShowAddCh(true)} style={{ cursor: 'pointer', marginTop: '12px' }}>
                        <span>+</span> Add another channel
                      </div>
                    )}
                  </div>
                )}
                {hook.currentStep === 4 && (
                  <div>
                    <div className="section-title">Settings &amp; Rules</div>
                    <div className="section-sub">Configure privacy, roles, and community guidelines.</div>
                    <PrivacyTypeSelector
                      privacy={hook.privacy} permissions={hook.permissions}
                      onPrivacyChange={hook.setPrivacy}
                      onPermissionToggle={(key) => hook.setPermissions({ ...hook.permissions, [key]: !hook.permissions[key] })}
                    />
                    <CommunityRulesInput
                      rules={hook.rules} welcomeMsg={hook.welcomeMsg}
                      onRulesChange={hook.setRules} onWelcomeMsgChange={hook.setWelcomeMsg}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Standalone Channel Flow */}
            {hook.activeTab === 'channel' && (
              <div className="fview on">
                <div className="section-title">Create a Channel</div>
                <div className="section-sub">Add a new channel to an existing community.</div>
                <div className="fg">
                  <label className="f-label">Community</label>
                  <select className="f-sel" value={hook.channelCommId} onChange={(e) => hook.setChannelCommId(e.target.value)}>
                    {hook.allCommunities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <div className="f-label">Channel Type</div>
                  <div className="ch-type-picker" style={{ display: 'flex', gap: '8px' }}>
                    {['Text', 'Voice', 'Announcement', 'Forum', 'Events'].map((t) => (
                      <button key={t} type="button" className={`ctp ${hook.standaloneChType === t ? 'on' : ''}`} onClick={() => hook.setStandaloneChType(t)}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="fg-row">
                  <div>
                    <div className="f-label">Channel Name <span className="f-req">*</span></div>
                    <input className="f-in" value={hook.standaloneChName} onChange={(e) => hook.setStandaloneChName(e.target.value)} placeholder="e.g. resources" />
                  </div>
                  <div>
                    <div className="f-label">Topic</div>
                    <input className="f-in" value={hook.standaloneChTopic} onChange={(e) => hook.setStandaloneChTopic(e.target.value)} placeholder="What's this channel about?" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <CreateCommunityActions
          activeTab={hook.activeTab}
          currentStep={hook.currentStep}
          submitting={hook.submitting}
          onPrev={hook.prevStep}
          onNext={hook.nextStep}
          onCreateChannel={hook.submitCreateChannel}
        />
      </div>
    </div>
  );
}
