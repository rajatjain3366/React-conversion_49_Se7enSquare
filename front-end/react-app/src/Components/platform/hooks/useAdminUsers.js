import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { apiRequest, getStoredUser } from '../../../services/api';

/**
 * Custom hook managing user directory, role editing, suspensions, bans, and reinstatement.
 * All mutations call the API first, await confirmation, then refresh the user list.
 * No optimistic local updates. Each successful action is reported to onAudit.
 */
export default function useAdminUsers(showToast, onAudit) {
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);

  const adminUser = getStoredUser();
  const showToastRef = useRef(showToast);
  const onAuditRef = useRef(onAudit);
  useEffect(() => {
    showToastRef.current = showToast;
    onAuditRef.current = onAudit;
  }, [showToast, onAudit]);

  const userLabel = useCallback((userId) => {
    const u = users.find((x) => x.id === userId);
    return u?.username ? `@${u.username}` : `user #${userId}`;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchSearch =
        !userSearch ||
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [users, userSearch, userRoleFilter]);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await apiRequest('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch { /* leave current list */ }
  }, []);

  // Initial load once on mount
  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const updateUserRole = useCallback(async (userId, newRole) => {
    if (userId === adminUser?.id) {
      showToastRef.current?.('⚠️ Cannot change your own role');
      return;
    }
    try {
      await apiRequest(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setEditingUser(null);
      showToastRef.current?.(`✓ Role updated to ${newRole}`);
      onAuditRef.current?.('User Role Changed', userLabel(userId), `Role set to ${newRole}`);
      await refreshUsers();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [adminUser?.id, refreshUsers, userLabel]);

  const suspendUser = useCallback(async (userId, reason) => {
    if (userId === adminUser?.id) {
      showToastRef.current?.('❌ Cannot suspend your own account');
      return;
    }
    const targetUser = users.find((u) => u.id === userId);
    const defaultReason = reason || 'Violation of community guidelines';
    const r = window.prompt(`Suspend ${targetUser?.username || `user #${userId}`}?\nEnter reason:`, defaultReason);
    if (!r?.trim()) return;
    try {
      await apiRequest(`/users/${userId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason: r.trim() }),
      });
      showToastRef.current?.('⚠️ User suspended');
      onAuditRef.current?.('User Suspended', userLabel(userId), r.trim());
      await refreshUsers();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [adminUser?.id, users, refreshUsers, userLabel]);

  const banUser = useCallback(async (userId, reason) => {
    if (userId === adminUser?.id) {
      showToastRef.current?.('❌ Cannot ban your own account');
      return;
    }
    const targetUser = users.find((u) => u.id === userId);
    const defaultReason = reason || 'Repeated policy violations';
    const r = window.prompt(`Permanently ban @${targetUser?.username || `user #${userId}`}?\nEnter reason:`, defaultReason);
    if (!r?.trim()) return;
    try {
      await apiRequest(`/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason: r.trim() }),
      });
      showToastRef.current?.(`⛔ User banned`);
      onAuditRef.current?.('User Banned', userLabel(userId), r.trim());
      await refreshUsers();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [adminUser?.id, users, refreshUsers, userLabel]);

  const reinstateUser = useCallback(async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!window.confirm(`Reinstate ${targetUser?.username || `user #${userId}`}? Their account will be unlocked.`)) return;
    try {
      await apiRequest(`/users/${userId}/reinstate`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Reinstated by admin' }),
      });
      showToastRef.current?.('✓ User reinstated');
      onAuditRef.current?.('User Reinstated', userLabel(userId), 'Reinstated by admin');
      await refreshUsers();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [users, refreshUsers, userLabel]);

  return {
    users,
    setUsers,
    refreshUsers,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    editingUser,
    setEditingUser,
    filteredUsers,
    updateUserRole,
    suspendUser,
    banUser,
    reinstateUser,
  };
}
