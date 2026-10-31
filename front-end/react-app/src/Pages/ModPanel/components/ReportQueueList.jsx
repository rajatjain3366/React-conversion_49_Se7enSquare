import React from 'react';

const TAB_LABELS = {
  pending: 'Pending',
  reviewed: 'In Review',
  resolved: 'Resolved',
};

/**
 * Left panel - report queue with modern card design and shimmer loading.
 */
export default function ReportQueueList({
  QUEUE_TABS,
  activeQTab, onTabChange,
  queueSearch, onQueueSearchChange,
  queueCounts,
  loading,
  filteredReports,
  selectedReport, onSelectReport,
}) {
  return (
    <div className="mp-queue-panel">
      <div className="mp-qp-header">
        <div className="mp-qp-title-row">
          <div className="mp-qp-title">Report Queue</div>
          <div className="mp-qp-count-badge">{queueCounts[activeQTab] || 0}</div>
        </div>

        <div className="mp-qp-tabs">
          {QUEUE_TABS.map(tab => (
            <div
              key={tab}
              className={`mp-qp-tab${activeQTab === tab ? ' active' : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {TAB_LABELS[tab] || (tab.charAt(0).toUpperCase() + tab.slice(1))}
              {queueCounts[tab] > 0 && ` (${queueCounts[tab]})`}
            </div>
          ))}
        </div>
      </div>

      <div className="mp-qp-search">
        <div className="mp-search-input-wrapper">
          <span className="mp-search-icon">🔍</span>
          <input
            className="mp-search-input"
            type="text"
            placeholder="Search reports…"
            value={queueSearch}
            onChange={e => onQueueSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="mp-queue-list" id="queueList">
        {loading ? (
          <div className="mp-loading">
            {[1,2,3,4].map(i => (
              <div key={i} className="mp-shimmer" />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="mp-empty-state">
            <div className="mp-empty-icon">
              {activeQTab === 'pending' ? '✅' : activeQTab === 'reviewed' ? '🔍' : '📂'}
            </div>
            <div className="mp-empty-text">
              {activeQTab === 'pending'
                ? 'All clear! No pending reports.'
                : `No ${TAB_LABELS[activeQTab] || activeQTab} reports.`}
            </div>
          </div>
        ) : (
          filteredReports.map(report => (
            <div
              key={report.id}
              className={`mp-queue-item${selectedReport?.id === report.id ? ' selected' : ''}`}
              onClick={() => onSelectReport(report)}
            >
              <div className="mp-qi-top">
                <span className="mp-qi-ref">{report.ref}</span>
                <span className={`mp-qi-sev sev-${report.severity}`}>{report.severity}</span>
              </div>
              <div className="mp-qi-user">{report.reportedUser /* "@name", "Post #1" or "Community: name" */}</div>
              <div className="mp-qi-reason">{report.reason}</div>
              <div className="mp-qi-time">{report.date}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
