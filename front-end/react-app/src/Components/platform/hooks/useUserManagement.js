import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectAdminUsers } from '../../../store/slices/adminUsersSlice';

/**
 * Manages the User Management page. The user list is the same adminUsers slice
 * the Admin Dashboard's Users tab uses; search and role filter are page-only state.
 */
export default function useUserManagement() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const users = useSelector(selectAdminUsers);

  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    // A failed fetch leaves the list empty, like before
    dispatch(fetchUsers()).finally(() => setLoading(false));
  }, [dispatch]);

  const filteredUsers = users.filter(u => {
    const matchSearch =
      !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Derived role counts for stats
  const roleCounts = {
    total:     users.length,
    admin:     users.filter(u => u.role === 'admin').length,
    moderator: users.filter(u => u.role === 'moderator').length,
    user:      users.filter(u => u.role === 'user').length,
  };

  return {
    navigate,
    users, loading,
    filteredUsers,
    search, setSearch,
    roleFilter, setRoleFilter,
    roleCounts,
  };
}
