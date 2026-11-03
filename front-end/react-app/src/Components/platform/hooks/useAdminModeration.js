import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../../../services/api';
import { appealService } from '../../../services/appealService';

/**
 * Custom hook managing reports queue, appeals, events, and organizer/moderator applications.
 * All mutations call the backend first, await confirmation, show server error on failure,
 * and refetch the updated lists. No optimistic updates. Each successful action is reported to onAudit.
 */
export default function useAdminModeration(showToast, onUserUpdated, onAudit) {
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [organizerApps, setOrganizerApps] = useState([]);
  const [moderatorApps, setModeratorApps] = useState([]);

  const showToastRef = useRef(showToast);
  const onUserUpdatedRef = useRef(onUserUpdated);
  const onAuditRef = useRef(onAudit);
  useEffect(() => {
    showToastRef.current = showToast;
    onUserUpdatedRef.current = onUserUpdated;
    onAuditRef.current = onAudit;
  });

  const refreshReports = useCallback(async () => {
    try {
      const data = await apiRequest('/reports');
      setReports(Array.isArray(data) ? data : []);
    } catch { /* keep current */ }
  }, []);

  const refreshAppeals = useCallback(async () => {
    try {
      const data = await apiRequest('/appeals');
      setAppeals(Array.isArray(data) ? data : []);
    } catch { /* keep current */ }
  }, []);

  const refreshEvents = useCallback(async () => {
    try {
      const data = await apiRequest('/events');
      setEvents(Array.isArray(data) ? data : []);
    } catch { /* keep current */ }
  }, []);

  const refreshApps = useCallback(async () => {
    try {
      const [orgRes, modRes, usersRes] = await Promise.all([
        apiRequest('/organisers'),
        apiRequest('/moderator-certification'),
        apiRequest('/users'),
      ]);

      const users = Array.isArray(usersRes) ? usersRes : [];
      const userMap = new Map(users.map((u) => [u.id, u]));

      if (Array.isArray(orgRes)) {
        setOrganizerApps(
          orgRes.map((o) => ({
            id: o.id,
            user: userMap.get(o.userId)?.username || `User #${o.userId}`,
            experience: o.experienceNote || 'Experience note on file',
            applied: o.appliedAt ? new Date(o.appliedAt).toLocaleDateString() : 'Recently',
            status: o.status || 'pending',
          }))
        );
      }

      if (Array.isArray(modRes)) {
        setModeratorApps(
          modRes.map((m) => ({
            id: m.id,
            user: userMap.get(m.userId)?.username || `User #${m.userId}`,
            quizScore: `${m.quizScore ?? 0}%`,
            applied: m.appliedAt ? new Date(m.appliedAt).toLocaleDateString() : 'Recently',
            status: m.status || 'pending',
          }))
        );
      }
    } catch { /* keep current */ }
  }, []);

  // Initial load once on mount
  useEffect(() => {
    refreshReports();
    refreshAppeals();
    refreshEvents();
    refreshApps();
  }, [refreshReports, refreshAppeals, refreshEvents, refreshApps]);

  const handleModerationAction = useCallback(async (item, actionType, note) => {
    const resolutionNote = (note || '').trim();
    // EscalatedReportsTab passes the report enriched with the target user object
    const reportTarget = item.target?.username
      ? `@${item.target.username} · report #${item.id}`
      : `report #${item.id}`;
    const logAudit = (action, reason) => onAuditRef.current?.(action, reportTarget, reason);

    try {
      if (actionType === 'dismiss') {
        if (!resolutionNote) {
          showToastRef.current?.('⚠️ Resolution note is required to dismiss a report');
          return;
        }
        await apiRequest(`/reports/${item.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'resolved', resolutionNote }),
        });
        showToastRef.current?.('✓ Report dismissed');
        logAudit('Report Dismissed', resolutionNote);
      } else if (actionType === 'warn') {
        const reason = resolutionNote || 'Official warning following escalated report';
        await apiRequest('/sanctions', {
          method: 'POST',
          body: JSON.stringify({
            targetUserId: item.targetId,
            communityId: item.communityId || null,
            type: 'warn',
            reason,
            reportId: item.id,
          }),
        });
        await apiRequest(`/reports/${item.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'resolved', resolutionNote: reason }),
        });
        showToastRef.current?.('⚠️ Warning issued and report resolved');
        logAudit('Warning Issued', reason);
      } else if (actionType === 'remove_content') {
        const reason = resolutionNote || 'Content removed following escalated report';
        await apiRequest('/sanctions', {
          method: 'POST',
          body: JSON.stringify({
            targetUserId: item.targetId,
            communityId: item.communityId || null,
            type: 'content_removed',
            reason,
            reportId: item.id,
          }),
        });
        await apiRequest(`/reports/${item.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'resolved', resolutionNote: reason }),
        });
        showToastRef.current?.('🗑️ Content marked removed and author sanctioned');
        logAudit('Content Removed', reason);
      } else if (actionType === 'suspend_author') {
        const reason = resolutionNote || 'Author suspended following escalated report';
        await apiRequest(`/users/${item.targetId}/suspend`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });
        await apiRequest(`/reports/${item.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'resolved', resolutionNote: reason }),
        });
        showToastRef.current?.('⚠️ Author suspended and report resolved');
        logAudit('Author Suspended', reason);
        if (onUserUpdatedRef.current) onUserUpdatedRef.current();
      } else if (actionType === 'ban_author') {
        const reason = resolutionNote || 'Author permanently banned following escalated report';
        await apiRequest(`/users/${item.targetId}/ban`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });
        await apiRequest(`/reports/${item.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'resolved', resolutionNote: reason }),
        });
        showToastRef.current?.('⛔ Author permanently banned');
        logAudit('Author Banned', reason);
        if (onUserUpdatedRef.current) onUserUpdatedRef.current();
      }

      await refreshReports();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [refreshReports]);

  const handleAppeal = useCallback(async (appealId, status) => {
    try {
      await appealService.reviewAppeal(appealId, status);
      showToastRef.current?.(`✓ Appeal ${status}`);
      onAuditRef.current?.(status === 'approved' ? 'Appeal Approved' : 'Appeal Rejected', `appeal #${appealId}`);
      await refreshAppeals();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [refreshAppeals]);

  const handleOrganizerApp = useCallback(async (id, newStatus) => {
    const status = newStatus === 'approved' ? 'verified' : 'rejected';
    const rejectionReason = status === 'rejected' ? window.prompt('Reason for rejecting this application (5–500 characters):') : undefined;
    if (status === 'rejected' && !rejectionReason) return;
    try {
      await apiRequest(`/organisers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
      });
      showToastRef.current?.(`Application ${status}`);
      const applicant = organizerApps.find((a) => a.id === id)?.user;
      onAuditRef.current?.(
        status === 'verified' ? 'Organizer Application Approved' : 'Organizer Application Rejected',
        applicant ? `@${applicant}` : `application #${id}`,
        rejectionReason
      );
      await refreshApps();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [refreshApps, organizerApps]);

  const handleModeratorApp = useCallback(async (id, newStatus) => {
    const status = newStatus === 'approved' ? 'certified' : 'rejected';
    const rejectionReason = status === 'rejected' ? window.prompt('Reason for rejecting this application (5–500 characters):') : undefined;
    if (status === 'rejected' && !rejectionReason) return;
    try {
      await apiRequest(`/moderator-certification/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason }),
      });
      showToastRef.current?.(`Application ${status}`);
      const applicant = moderatorApps.find((a) => a.id === id)?.user;
      onAuditRef.current?.(
        status === 'certified' ? 'Moderator Application Approved' : 'Moderator Application Rejected',
        applicant ? `@${applicant}` : `application #${id}`,
        rejectionReason
      );
      await refreshApps();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [refreshApps, moderatorApps]);

  return {
    reports,
    setReports,
    refreshReports,
    events,
    setEvents,
    refreshEvents,
    appeals,
    setAppeals,
    refreshAppeals,
    organizerApps,
    setOrganizerApps,
    moderatorApps,
    setModeratorApps,
    refreshApps,
    handleModerationAction,
    handleAppeal,
    handleOrganizerApp,
    handleModeratorApp,
  };
}
