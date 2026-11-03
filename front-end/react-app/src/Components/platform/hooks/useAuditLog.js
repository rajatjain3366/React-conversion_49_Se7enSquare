import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../services/api';

/**
 * Custom hook managing the administrative audit log (GET/POST /audit-log).
 * Like the other admin hooks, a new entry is posted first and the list is
 * refetched, so the table only shows what the backend actually stored.
 */
export default function useAuditLog(adminUsername = 'admin') {
  const [auditLog, setAuditLog] = useState([]);

  const refreshAuditLog = useCallback(async () => {
    try {
      const data = await apiRequest('/audit-log');
      const rows = Array.isArray(data) ? [...data] : [];
      // Seed rows are stored oldest-first while new rows are prepended, so sort newest-first here
      rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setAuditLog(
        rows.map((l) => ({
          id: l.id,
          time: l.createdAt
            ? new Date(l.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
            : '—',
          admin: l.actor || 'system',
          action: l.action,
          target: l.target || 'general',
          reason: l.reason || '',
        }))
      );
    } catch { /* keep current */ }
  }, []);

  // Initial load once on mount
  useEffect(() => {
    refreshAuditLog();
  }, [refreshAuditLog]);

  // Called after an admin action has already succeeded, so a failed log write is
  // swallowed instead of reported as if the action itself had failed.
  const addAuditLog = useCallback(async (action, target, reason) => {
    try {
      await apiRequest('/audit-log', {
        method: 'POST',
        body: JSON.stringify({
          action: String(action).slice(0, 100),
          actor: String(adminUsername).slice(0, 60),
          ...(target ? { target: String(target).slice(0, 100) } : {}),
          ...(reason ? { reason: String(reason).slice(0, 200) } : {}),
        }),
      });
      await refreshAuditLog();
    } catch { /* keep current */ }
  }, [adminUsername, refreshAuditLog]);

  return { auditLog, refreshAuditLog, addAuditLog };
}
