import React from 'react';

/**
 * Activity snippet of recent administrative actions for Overview.
 */
export default function RecentAuditList({ auditLog, onNavigate }) {
  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Recent Administrative Actions</h3>
        <button
          onClick={() => onNavigate('audit')}
          style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '13px' }}
        >
          View all →
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {auditLog.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3, #888)', fontSize: '13px' }}>
            No recent administrative actions logged.
          </div>
        ) : (
          auditLog.slice(0, 4).map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-1,#fff)' }}>
                  {item.action}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-3,#666)', marginTop: '2px' }}>
                  By @{item.admin} • {item.time}
                </div>
              </div>
              <span className="admin-badge-role">{item.target}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
