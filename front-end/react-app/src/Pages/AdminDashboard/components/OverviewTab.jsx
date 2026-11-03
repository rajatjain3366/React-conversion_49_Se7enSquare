import React from 'react';
import StatCard from '../../../Components/platform/common/StatCard';
import { getStatCards } from '../../../Components/platform/data/adminData';
import QuickActions from './QuickActions';
import RecentAuditList from './RecentAuditList';

/**
 * Overview tab composing stat cards, quick actions, and recent audit entries.
 */
export default function OverviewTab({ stats, auditLog, onNavigate }) {
  const statCards = getStatCards(stats);

  return (
    <div className="admin-page active" id="page-overview">
      <div className="stats-grid">
        {statCards.map((card) => (
          <StatCard
            key={card.id}
            card={card}
            onClick={() => onNavigate(card.page)}
          />
        ))}
      </div>

      <QuickActions onNavigate={onNavigate} />

      <RecentAuditList auditLog={auditLog || []} onNavigate={onNavigate} />
    </div>
  );
}
