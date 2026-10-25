import React from 'react';
import { REVENUE_CARDS } from '../../../Components/platform/data/ownerDashboardData';

/**
 * Revenue + platform metric grid.
 * Uses REVENUE_CARDS definition to render clickable stat cards.
 * The `stats` prop supplies the top-level community/event counts;
 * `revenue` supplies the financial metrics.
 */
export default function OwnerMetricsGrid({ stats, revenue, onDrill }) {
  return (
    <>
      {/* Communities & Events */}
      <div className="stats-grid">
        <div
          className="stat-card drill-card"
          onClick={() => onDrill('communities')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon bg-cyan">🏘️</div>
          <div className="stat-data">
            <div className="stat-value">{stats.totalCommunities}</div>
            <div className="stat-label">Communities</div>
            {stats.suspendedCommunitiesCount > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-3, #9ca3af)', marginTop: '2px' }}>
                {stats.totalCommunities} active · {stats.suspendedCommunitiesCount} suspended
              </div>
            )}
          </div>
        </div>
        <div
          className="stat-card drill-card"
          onClick={() => onDrill('events')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon bg-green">📅</div>
          <div className="stat-data">
            <div className="stat-value">{stats.totalEvents}</div>
            <div className="stat-label">Total Events</div>
            {stats.suspendedEventsCount > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-3, #9ca3af)', marginTop: '2px' }}>
                {stats.totalEvents} active · {stats.suspendedEventsCount} in suspended comm.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="card-header" style={{ marginBottom: '14px', marginTop: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
          Revenue Overview
        </h3>
      </div>
      <div className="stats-grid">
        {REVENUE_CARDS.map((card) => (
          <div
            key={card.key}
            className="stat-card drill-card"
            onClick={() => onDrill(card.drillKind, card.drillFilter)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`stat-icon ${card.bg}`}>{card.icon}</div>
            <div className="stat-data">
              <div className="stat-value">
                {card.prefix}{(revenue[card.key] || 0).toLocaleString()}
              </div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
