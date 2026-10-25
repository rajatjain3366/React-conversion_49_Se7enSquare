import React, { useState, useMemo } from 'react';

/**
 * Communities breakdown subcomponent with Active / Suspended / All tab filtering.
 */
function CommunitiesDrilldown({ communities = [], users = [], loadError = '' }) {
  const [filter, setFilter] = useState('active');

  const usersById = useMemo(
    () => new Map((Array.isArray(users) ? users : []).map((u) => [String(u.id), u])),
    [users]
  );

  const activeCommunities = useMemo(
    () => (Array.isArray(communities) ? communities : []).filter((c) => (c.status || 'active').toLowerCase() !== 'suspended'),
    [communities]
  );

  const suspendedCommunities = useMemo(
    () => (Array.isArray(communities) ? communities : []).filter((c) => (c.status || 'active').toLowerCase() === 'suspended'),
    [communities]
  );

  const displayed = useMemo(() => {
    if (filter === 'active') return activeCommunities;
    if (filter === 'suspended') return suspendedCommunities;
    return Array.isArray(communities) ? communities : [];
  }, [filter, activeCommunities, suspendedCommunities, communities]);

  return (
    <div>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilter('active')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: filter === 'active' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
            background: filter === 'active' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
            color: filter === 'active' ? '#60a5fa' : 'var(--text-3, #9ca3af)',
            transition: 'all 0.2s',
          }}
        >
          Active ({activeCommunities.length})
        </button>

        {suspendedCommunities.length > 0 && (
          <button
            type="button"
            onClick={() => setFilter('suspended')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: filter === 'suspended' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
              background: filter === 'suspended' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
              color: filter === 'suspended' ? '#f87171' : 'var(--text-3, #9ca3af)',
              transition: 'all 0.2s',
            }}
          >
            Suspended ({suspendedCommunities.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: filter === 'all' ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
            background: filter === 'all' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
            color: filter === 'all' ? '#c084fc' : 'var(--text-3, #9ca3af)',
            transition: 'all 0.2s',
          }}
        >
          All ({communities.length})
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th>Members</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3,#888)' }}>
                  {loadError ? `⚠️ Could not load: ${loadError}` : `No ${filter} communities found.`}
                </td>
              </tr>
            ) : (
              displayed.map((c) => {
                const owner = usersById.get(String(c.ownerId));
                const isSuspended = (c.status || '').toLowerCase() === 'suspended';
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="row-name">{c.icon || '🏘️'} {c.name}</div>
                      {isSuspended && c.suspendedReason && (
                        <div className="row-sub" style={{ fontSize: '11px', color: '#f87171' }}>
                          Reason: {c.suspendedReason}
                        </div>
                      )}
                    </td>
                    <td>{owner?.username || `user#${c.ownerId ?? '—'}`}</td>
                    <td>{(c.memberCount || 0).toLocaleString()}</td>
                    <td>{c.category || 'Gaming'}</td>
                    <td>
                      <span className={`badge badge-${isSuspended ? 'rejected' : 'active'}`}>
                        {c.status || 'active'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Events overview subcomponent with Active / In Suspended Community / All tab filtering.
 */
function EventsDrilldown({ events = [], communities = [], loadError = '' }) {
  const [filter, setFilter] = useState('active');

  const commsById = useMemo(
    () => new Map((Array.isArray(communities) ? communities : []).map((c) => [String(c.id), c])),
    [communities]
  );

  const suspendedCommIds = useMemo(() => {
    const ids = new Set();
    (Array.isArray(communities) ? communities : []).forEach((c) => {
      if ((c.status || '').toLowerCase() === 'suspended') {
        ids.add(String(c.id));
      }
    });
    return ids;
  }, [communities]);

  const activeEvents = useMemo(
    () => (Array.isArray(events) ? events : []).filter((e) => !suspendedCommIds.has(String(e.communityId))),
    [events, suspendedCommIds]
  );

  const suspendedCommEvents = useMemo(
    () => (Array.isArray(events) ? events : []).filter((e) => suspendedCommIds.has(String(e.communityId))),
    [events, suspendedCommIds]
  );

  const displayed = useMemo(() => {
    const list = filter === 'active'
      ? activeEvents
      : filter === 'in_suspended'
      ? suspendedCommEvents
      : (Array.isArray(events) ? events : []);
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filter, activeEvents, suspendedCommEvents, events]);

  return (
    <div>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilter('active')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: filter === 'active' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
            background: filter === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
            color: filter === 'active' ? '#34d399' : 'var(--text-3, #9ca3af)',
            transition: 'all 0.2s',
          }}
        >
          Active Events ({activeEvents.length})
        </button>

        {suspendedCommEvents.length > 0 && (
          <button
            type="button"
            onClick={() => setFilter('in_suspended')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: filter === 'in_suspended' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
              background: filter === 'in_suspended' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
              color: filter === 'in_suspended' ? '#fbbf24' : 'var(--text-3, #9ca3af)',
              transition: 'all 0.2s',
            }}
          >
            In Suspended Comm. ({suspendedCommEvents.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: filter === 'all' ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
            background: filter === 'all' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
            color: filter === 'all' ? '#c084fc' : 'var(--text-3, #9ca3af)',
            transition: 'all 0.2s',
          }}
        >
          All ({events.length})
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Community</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3,#888)' }}>
                  {loadError ? `⚠️ Could not load: ${loadError}` : 'No events found.'}
                </td>
              </tr>
            ) : (
              displayed.map((e) => {
                const comm = commsById.get(String(e.communityId));
                const isCommSuspended = (comm?.status || '').toLowerCase() === 'suspended';
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="row-name">{e.title}</div>
                      <div className="row-sub" style={{ fontSize: '11.5px', color: 'var(--text-3,#888)' }}>
                        {e.type || 'event'}{e.entryFee ? ` · ₹${e.entryFee} entry` : ''}
                      </div>
                    </td>
                    <td>
                      {comm?.name || `Community #${e.communityId ?? '—'}`}
                      {isCommSuspended && (
                        <span
                          className="badge badge-rejected"
                          style={{ fontSize: '10px', marginLeft: '6px', padding: '2px 6px' }}
                        >
                          Suspended Comm
                        </span>
                      )}
                    </td>
                    <td>{e.date}{e.time ? ` · ${e.time}` : ''}</td>
                    <td>
                      <span className={`badge badge-${e.status || 'pending'}`}>
                        {e.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Drill-down modal for OwnerDashboard.
 * Renders structured JSX for each drill kind from the data returned by useOwnerDashboard.
 */
export default function SubscriptionsTab({ drillModalOpen, drillTitle, drillLoading, drillContent, onClose }) {
  if (!drillModalOpen) return null;

  const renderContent = () => {
    if (drillLoading) {
      return (
        <div className="empty-state" style={{ padding: '30px' }}>
          <div className="empty-state-text">Loading…</div>
        </div>
      );
    }
    if (!drillContent) return null;

    if (drillContent.kind === 'error') {
      return <div style={{ color: 'var(--text-3)', padding: '20px' }}>Could not load details: {drillContent.message}</div>;
    }

    if (drillContent.kind === 'communities') {
      return (
        <CommunitiesDrilldown
          communities={drillContent.communities}
          users={drillContent.users}
          loadError={drillContent.loadError}
        />
      );
    }

    if (drillContent.kind === 'events') {
      return (
        <EventsDrilldown
          events={drillContent.events}
          communities={drillContent.communities}
          loadError={drillContent.loadError}
        />
      );
    }

    if (drillContent.kind === 'revenue') {
      const { payments = [], loadError = '' } = drillContent;
      const byType = payments.reduce((acc, p) => { acc[p.type] = (acc[p.type] || 0) + (p.amount || 0); return acc; }, {});
      const sorted = [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
      return (
        <div>
          {payments.length > 0 && (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', marginBottom: '18px' }}>
              {Object.entries(byType).map(([type, amt]) => (
                <div key={type} className="stat-card" style={{ padding: '12px' }}>
                  <div className="stat-value" style={{ fontSize: '18px' }}>₹{amt.toLocaleString()}</div>
                  <div className="stat-label">{type.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          )}
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Type</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3,#888)' }}>{loadError ? `⚠️ Could not load: ${loadError}` : 'No transactions yet.'}</td></tr>
                ) : sorted.map((p, i) => (
                  <tr key={p.id ?? i}>
                    <td><span className="badge badge-active">{p.type.replace(/_/g, ' ')}</span></td>
                    <td>₹{(p.amount || 0).toLocaleString()}</td>
                    <td>{p.description}</td>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length > 50 && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-3,#888)' }}>
              Showing 50 most recent of {payments.length} transactions
            </div>
          )}
        </div>
      );
    }

    if (drillContent.kind === 'subscriptions') {
      const { subData = { byPlan: {}, subscribers: [] }, loadError = '' } = drillContent;
      const subscribers = Array.isArray(subData.subscribers) ? subData.subscribers : [];
      return (
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-3,#888)', marginBottom: '14px', lineHeight: 1.6 }}>
            "Active Premium Users" below is a live snapshot — how many people are on a paid plan <em>right now</em>.
            "Subscription Revenue" on the main dashboard is cumulative — every upgrade payment ever collected, which
            a later downgrade or cancellation doesn't reverse. The two numbers measure different things and won't
            always move together; that's expected, not a bug.
          </p>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '18px' }}>
            {[
              { key: 'free', label: 'Free' },
              { key: 'plus', label: 'Plus' },
              { key: 'ultra_pro', label: 'Ultra Pro' },
            ].map(({ key, label }) => (
              <div key={key} className="stat-card" style={{ padding: '12px' }}>
                <div className="stat-value">{subData.byPlan?.[key] || 0}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Plan</th><th>Since</th></tr></thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3,#888)' }}>{loadError ? `⚠️ Could not load: ${loadError}` : 'No paid subscribers right now.'}</td></tr>
                ) : subscribers.map((s, idx) => (
                  <tr key={idx}>
                    <td>{s.username}</td>
                    <td><span className="badge badge-active">{s.plan === 'ultra_pro' ? 'Ultra Pro' : (s.plan ? s.plan[0].toUpperCase() + s.plan.slice(1) : 'Free')}</span></td>
                    <td>{s.startedAt ? new Date(s.startedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (drillContent.kind === 'organisers') {
      const { orgs = [], filter = '', loadError = '' } = drillContent;
      return (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>User</th><th>Plan</th><th>Applied</th></tr></thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3,#888)' }}>{loadError ? `⚠️ Could not load: ${loadError}` : `No ${filter} organisers.`}</td></tr>
              ) : orgs.map((o, idx) => (
                <tr key={idx}>
                  <td>{o.username || `user#${o.userId}`}</td>
                  <td><span className="badge badge-active">{o.plan === 'premium' ? 'Premium' : 'Free'}</span></td>
                  <td>{o.appliedAt ? new Date(o.appliedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="modal-overlay"
      style={{ display: 'flex' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-container" style={{ width: '640px', maxWidth: '92vw' }}>
        <div className="modal-header">
          <h3>{drillTitle}</h3>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
