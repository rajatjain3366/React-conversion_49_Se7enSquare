import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  fetchUsers,
  updateUserRole as updateUserRoleThunk,
  suspendUser as suspendUserThunk,
  banUser as banUserThunk,
  reinstateUser as reinstateUserThunk,
  userSearchChanged,
  userRoleFilterChanged,
  editingUserChanged,
  selectAdminUsers,
  selectUserSearch,
  selectUserRoleFilter,
  selectEditingUser,
  selectFilteredUsers,
} from '../../../store/slices/adminUsersSlice';

/**
 * Custom hook connecting the Users tab to the Redux adminUsers slice.
 * The thunks call the API, log the audit entry and re-fetch; this hook adds the
 * confirmation prompts, the "not yourself" guards and the toasts.
 */
export default function useAdminUsers(showToast) {
  const dispatch = useDispatch();
  const adminId = useSelector(selectCurrentUser)?.id;
  const users = useSelector(selectAdminUsers);
  const userSearch = useSelector(selectUserSearch);
  const userRoleFilter = useSelector(selectUserRoleFilter);
  const editingUser = useSelector(selectEditingUser);
  const filteredUsers = useSelector(selectFilteredUsers);

  const refreshUsers = useCallback(() => dispatch(fetchUsers()), [dispatch]);

  // Initial load once on mount
  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const usernameOf = (userId) => users.find((u) => u.id === userId)?.username;

  const updateUserRole = async (userId, newRole) => {
    if (userId === adminId) {
      showToast('⚠️ Cannot change your own role');
      return;
    }
    try {
      await dispatch(updateUserRoleThunk({ userId, role: newRole })).unwrap();
      showToast(`✓ Role updated to ${newRole}`);
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const suspendUser = async (userId, reason) => {
    if (userId === adminId) {
      showToast('❌ Cannot suspend your own account');
      return;
    }
    const r = window.prompt(
      `Suspend ${usernameOf(userId) || `user #${userId}`}?\nEnter reason:`,
      reason || 'Violation of community guidelines'
    );
    if (!r?.trim()) return;
    try {
      await dispatch(suspendUserThunk({ userId, reason: r.trim() })).unwrap();
      showToast('⚠️ User suspended');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const banUser = async (userId, reason) => {
    if (userId === adminId) {
      showToast('❌ Cannot ban your own account');
      return;
    }
    const r = window.prompt(
      `Permanently ban @${usernameOf(userId) || `user #${userId}`}?\nEnter reason:`,
      reason || 'Repeated policy violations'
    );
    if (!r?.trim()) return;
    try {
      await dispatch(banUserThunk({ userId, reason: r.trim() })).unwrap();
      showToast('⛔ User banned');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const reinstateUser = async (userId) => {
    if (!window.confirm(`Reinstate ${usernameOf(userId) || `user #${userId}`}? Their account will be unlocked.`)) return;
    try {
      await dispatch(reinstateUserThunk(userId)).unwrap();
      showToast('✓ User reinstated');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  return {
    users,
    refreshUsers,
    userSearch,
    setUserSearch: (value) => dispatch(userSearchChanged(value)),
    userRoleFilter,
    setUserRoleFilter: (value) => dispatch(userRoleFilterChanged(value)),
    editingUser,
    setEditingUser: (userId) => dispatch(editingUserChanged(userId)),
    filteredUsers,
    updateUserRole,
    suspendUser,
    banUser,
    reinstateUser,
  };
}
