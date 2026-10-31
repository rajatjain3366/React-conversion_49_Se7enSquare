import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUEUE_TABS, MOD_ACTIONS } from '../../../Components/platform/data/modPanelData';
import { moderationService } from '../../../services/moderationService';
import { authService } from '../../../services/authService';

function getUser() {
  const u = authService.getCurrentUser();
  return {
    role: u?.role || 'moderator',
    firstName: u?.firstName || u?.username || 'Moderator',
    username: u?.username || 'moderator',
  };
}

/**
 * Custom hook managing all state, data fetching, filtering, and moderation actions for ModPanel.
 */
export default function useModPanel() {
  const navigate = useNavigate();
  const user = getUser();

  const [reports, setReports] = useState([]);
  const [activeQTab, setActiveQTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [queueSearch, setQueueSearch] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  // Fetch reports from backend on mount
  useEffect(() => {
    async function fetchReports() {
      try {
        const data = await moderationService.getReports();
        if (Array.isArray(data)) {
          // Reports only store targetId. For user reports, look up each
          // reported user's username once (GET /users/:id) so the queue shows
          // "player01" instead of "4". A failed lookup just falls back to the ID.
          const userIds = [...new Set(data.filter((r) => r.targetType === 'user').map((r) => r.targetId))];
          const usernames = {};
          await Promise.all(userIds.map(async (uid) => {
            try {
              const u = await moderationService.getUser(uid);
              if (u?.username) usernames[uid] = u.username;
            } catch { /* keep the ID */ }
          }));

          // Same for community reports: look up the community name once.
          const communityIds = [...new Set(data.filter((r) => r.targetType === 'community').map((r) => r.targetId))];
          const communityNames = {};
          await Promise.all(communityIds.map(async (cid) => {
            try {
              const c = await moderationService.getCommunity(cid);
              if (c?.name) communityNames[cid] = c.name;
            } catch { /* deleted community: keep the ID */ }
          }));

          // What the report is about, shown in the queue, detail view and
          // recent actions. A post/community targetId is NOT a user ID, so it
          // must not be shown as "@4" like a username.
          const targetLabel = (r) => {
            if (r.targetType === 'post') return `Post #${r.targetId}`;
            if (r.targetType === 'community') {
              return `Community: ${communityNames[r.targetId] || `#${r.targetId}`}`;
            }
            return `@${usernames[r.targetId] || r.reportedUser?.username || r.targetId || 'Unknown'}`;
          };

          const mapped = data.map((r) => ({
            id: r.id,
            ref: r.ref || `RPT-${r.id}`,
            type: r.targetType || 'message',
            targetId: r.targetId, // needed to sanction the reported user
            // Display label, always a string (the queue search calls .toLowerCase()).
            reportedUser: targetLabel(r),
            channel: r.channel || '#general',
            reason: r.reason || 'Violation',
            status: r.status || 'pending',
            date: r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
            context: r.context || '',
            severity: r.severity || 'medium',
            action: r.action,
          }));
          setReports(mapped);
          setSelectedReport((prev) => {
            if (prev) {
              const stillExists = mapped.find((m) => m.id === prev.id);
              if (stillExists) return stillExists;
            }
            return mapped.length > 0 ? mapped[0] : null;
          });
        } else {
          setReports([]);
          setSelectedReport(null);
        }
      } catch {
        setReports([]);
        setSelectedReport(null);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [user.role]);

  const filteredReports = reports.filter(
    (r) =>
      r.status === activeQTab &&
      (!queueSearch ||
        r.reportedUser?.toLowerCase().includes(queueSearch.toLowerCase()) ||
        r.ref?.toLowerCase().includes(queueSearch.toLowerCase()) ||
        r.reason?.toLowerCase().includes(queueSearch.toLowerCase()))
  );

  // Update one report's status (and optional action text) in the list and in
  // the detail view, so the screen matches what the backend now has.
  const setReportStatus = (reportId, status, action) => {
    const patch = action ? { status, action } : { status };
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...patch } : r)));
    setSelectedReport((prev) => (prev && prev.id === reportId ? { ...prev, ...patch } : prev));
  };

  // Backend rule: pending -> reviewed -> resolved (no skipping).
  // Steps: 1) pending -> reviewed, 2) create the sanction, 3) reviewed -> resolved.
  // `reached` remembers how far we got, so if a later step fails the screen
  // still shows the real status and the error is shown (no fake success).
  const takeAction = async (modAction, report) => {
    const note = actionNote.trim();
    const actionText = `${modAction.label}${note ? ` — ${note}` : ''}`;

    // Reports keep only targetType/targetId, so we can only sanction when the
    // target is a user. Post/community reports can still be dismissed or escalated.
    if (modAction.sanction && report.type !== 'user') {
      showToast('⚠️ Sanctions need a user report. Dismiss or escalate this one.');
      return;
    }

    setProcessing(true);
    let reached = report.status;
    try {
      if (reached === 'pending') {
        await moderationService.updateReportStatus(report.id, 'reviewed');
        reached = 'reviewed';
      }
      if (modAction.sanction) {
        await moderationService.createSanction({
          targetUserId: Number(report.targetId),
          type: modAction.sanction,
          reason: actionText,
          reportId: report.id,
          ...(modAction.hours
            ? { expiresAt: new Date(Date.now() + modAction.hours * 3600 * 1000).toISOString() }
            : {}),
        });
      }
      await moderationService.updateReportStatus(report.id, 'resolved', actionText);
      reached = 'resolved';
      setActionNote('');
      showToast(`✅ Action taken: ${modAction.label}`);
    } catch (err) {
      showToast(`❌ ${err.message}`);
    } finally {
      setReportStatus(report.id, reached, reached === 'resolved' ? actionText : undefined);
      setProcessing(false);
    }
  };

  // Backend allows escalation from pending or reviewed. Escalated reports
  // appear in the admin dashboard's "Escalated Reports" tab.
  const escalateReport = async (report) => {
    const note = actionNote.trim();
    setProcessing(true);
    try {
      await moderationService.updateReportStatus(report.id, 'escalated', note || undefined);
      setReportStatus(report.id, 'escalated');
      setActionNote('');
      showToast('⬆️ Escalated to admin');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const moveToReview = async (reportId) => {
    try {
      await moderationService.updateReportStatus(reportId, 'reviewed');
      setReportStatus(reportId, 'reviewed');
      showToast('📋 Moved to In Review');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const queueCounts = QUEUE_TABS.reduce((acc, tab) => {
    acc[tab] = reports.filter((r) => r.status === tab).length;
    return acc;
  }, {});

  const recentActions = reports.filter((r) => r.status === 'resolved' && r.action).slice(0, 3);

  return {
    navigate,
    user,
    // Reports
    reports,
    loading,
    filteredReports,
    selectedReport,
    setSelectedReport,
    // Queue
    activeQTab,
    setActiveQTab,
    queueSearch,
    setQueueSearch,
    queueCounts,
    // Actions
    actionNote,
    setActionNote,
    takeAction,
    escalateReport,
    moveToReview,
    processing,
    // Toast
    toast,
    // Derived
    recentActions,
    MOD_ACTIONS,
    QUEUE_TABS,
  };
}
