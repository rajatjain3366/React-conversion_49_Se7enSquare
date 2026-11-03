import React from 'react';
import SideBar from '../Components/SideBar';
import useDiscovery from '../Components/platform/hooks/useDiscovery';
import DiscoveryHeader from './Discovery/components/DiscoveryHeader';
import CategoryFilterBar from './Discovery/components/CategoryFilterBar';
import CommunityGrid from './Discovery/components/CommunityGrid';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/discovery.css';

/**
 * Discovery Page — thin orchestrator.
 * Layout mirrors discovery.html:
 *   .app-shell > [SideBar] + .main > [header.header] + .content > [.hero + .filter-bar + .body-area]
 * All state, filtering, sorting and join/leave logic lives in useDiscovery().
 */
export default function Discovery() {
  const {
    communities, loading, loadWarning,
    search, setSearch,
    activeCategory, setActiveCategory,
    sortBy, setSortBy,
    showSort, setShowSort,
    joinedIds, toggleJoin,
    categories, filtered,
    totalMembers, totalOnline, eventCount,
  } = useDiscovery();

  return (
    <div className="app-shell discovery-shell">
      <SideBar />
      <div className="main">
        <DiscoveryHeader />

        <div className="content discovery-content">
          <DiscoveryHero
            search={search}
            onSearchChange={setSearch}
            communities={communities}
            totalMembers={totalMembers}
            totalOnline={totalOnline}
            eventCount={eventCount}
            loadWarning={loadWarning}
          />

          <CategoryFilterBar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            sortBy={sortBy}
            onSortChange={(key) => { setSortBy(key); setShowSort(false); }}
            showSort={showSort}
            onToggleSort={() => setShowSort(s => !s)}
          />

          <CommunityGrid
            loading={loading}
            filtered={filtered}
            communities={communities}
            joinedIds={joinedIds}
            onToggleJoin={toggleJoin}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Inline Hero (lives inside .content, not in the header) ── */
function DiscoveryHero({ search, onSearchChange, communities, totalMembers, totalOnline, eventCount, loadWarning }) {
  const fmtStat = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <>
      <div className="hero">
        <div className="hero-title">
          Find your next <span>community</span>
        </div>
        <div className="hero-sub">Explore active gaming communities across every genre, skill level, and interest.</div>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            id="searchInput"
            type="text"
            placeholder="Search by name, topic, or keyword…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
          <span className="search-kbd">⌘K</span>
          <button className="search-btn">Search</button>
        </div>
        <div className="hero-stats">
          <div className="h-stat">🏘️ <strong>{communities.length.toLocaleString()}</strong>&nbsp;communities</div>
          <div className="h-stat">👥 <strong>{fmtStat(totalMembers)}</strong>&nbsp;members</div>
          <div className="h-stat">🟢 <strong>{totalOnline.toLocaleString()}</strong>&nbsp;online now</div>
          <div className="h-stat">📅 <strong>{eventCount !== null ? eventCount.toLocaleString() : '0'}</strong>&nbsp;upcoming events</div>
        </div>
      </div>

      {loadWarning && (
        <div style={{
          margin: '10px 32px 0', padding: '10px 14px', fontSize: '13px',
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: '10px', color: '#fbbf24',
        }}>
          ⚠️ {loadWarning}
        </div>
      )}
    </>
  );
}
