import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useCommunityPage, { memberCountOf } from '../Components/platform/hooks/useCommunityPage';
import { authService } from '../services/authService';
import { getHomeRoute } from '../services/roleAccess';
import CommunityBanner from './CommunityPage/components/CommunityBanner';
import CommunityNav from './CommunityPage/components/CommunityNav';
import CommunityAboutWidget from './CommunityPage/components/CommunityAboutWidget';
import PostFeed from './CommunityPage/components/PostFeed';
import CommunityMembersList from './CommunityPage/components/CommunityMembersList';
import CommunityRulesWidget from './CommunityPage/components/CommunityRulesWidget';
import '../styles/global.css';
import '../styles/community-page.css';

/**
 * CommunityPage — thin orchestrator.
 * All state, API calls, join/leave, owner gate, and delete logic live in useCommunityPage().
 */
export default function CommunityPage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const id = paramId || searchParams.get('id') || '1';

  const {
    community, loading, loadError,
    activeTab, setActiveTab,
    joined, toggleJoin,
    memberSearch, setMemberSearch,
    members, events,
    showToast,
    isOwner,
    channelEntries, foundedLabel, rules, filteredMembers,
    handleDelete,
  } = useCommunityPage(id, navigate);

  const TABS = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'channels', label: '📡 Channels', count: channelEntries.length },
    { id: 'members', label: '👥 Members', count: memberCountOf(community) },
    { id: 'rules', label: '📜 Rules', count: rules.length },
  ];

  if (loading && !community) {
    return (
      <div className="main">
        <header className="header">
          <button className="page-back-btn" onClick={() => navigate(-1)}>← Back</button>
        </header>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-3,#888)' }}>Loading community…</div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="main">
        <header className="header">
          <button className="page-back-btn" onClick={() => navigate('/discovery')}>← Back</button>
        </header>
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🫥</div>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Community not found</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3,#888)', marginBottom: '20px' }}>{loadError}</div>
          <button
            onClick={() => navigate('/discovery')}
            style={{ background: '#6366f1', border: 'none', borderRadius: '8px', padding: '9px 18px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            Browse Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <header className="header">
        <button className="page-back-btn" onClick={() => navigate(-1)} title="Back to communities">← Back</button>
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/discovery')}>Discover</button>
          <span className="sep">›</span>
          <button className="breadcrumb-link" onClick={() => navigate(getHomeRoute(authService.getCurrentUser()?.role))}>Dashboard</button>
          <span className="sep">›</span>
          <span className="current" id="breadcrumbCommunityName">{community.name}</span>
        </div>
        <div className="header-actions">
          <div className="icon-btn">🔔<div className="notif-dot"></div></div>
          <div className="header-avatar user-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile-settings')} />
        </div>
      </header>

      <CommunityBanner
        community={community}
        joined={joined}
        isOwner={isOwner}
        foundedLabel={foundedLabel}
        onToggleJoin={toggleJoin}
        onDelete={handleDelete}
      />

      <CommunityNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && (
        <CommunityAboutWidget
          community={community}
          channelEntries={channelEntries}
          foundedLabel={foundedLabel}
          events={events}
        />
      )}
      {activeTab === 'channels' && (
        <PostFeed
          community={community}
          channelEntries={channelEntries}
          joined={joined}
          isOwner={isOwner}
          onLockedClick={() => showToast('🔒 Join this community first to access channels!')}
        />
      )}
      {activeTab === 'members' && (
        <CommunityMembersList
          members={members}
          filteredMembers={filteredMembers}
          memberSearch={memberSearch}
          onMemberSearchChange={setMemberSearch}
        />
      )}
      {activeTab === 'rules' && (
        <CommunityRulesWidget community={community} rules={rules} />
      )}
    </div>
  );
}
