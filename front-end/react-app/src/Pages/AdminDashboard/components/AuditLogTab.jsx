import React from 'react';

/**
 * Full administrative audit log table, newest entries first.
 */
export default function AuditLogTab({ auditLog }) {
  const entries = auditLog || [];

  return (
    <div className="admin-page active" id="page-audit">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif", color: '#fff' }}>
            Audit Log
          </h3>
          <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
            Record of administrative actions taken on users, communities, reports, appeals, and applications
          </div>
        </div>
        <span className="admin-users-count-badge">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="admin-card-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Action</th>
                <th style={{ width: '14%' }}>By</th>
                <th style={{ width: '22%' }}>Target</th>
                <th style={{ width: '26%' }}>Reason</th>
                <th style={{ width: '16%' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: 'center', padding: '40px 20px', color: '#8b949e', fontSize: '14px' }}
                  >
                    No audit log records found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '13.5px' }}>
                        {entry.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#93c5fd', fontSize: '12.5px', fontWeight: 500 }}>
                        @{entry.admin}
                      </span>
                    </td>
                    <td>
                      <span className="admin-badge-role">{entry.target}</span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: '#cbd5e1' }} title={entry.reason}>
                      {entry.reason || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#8b949e', whiteSpace: 'nowrap' }}>
                      {entry.time}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
