import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuditLog, selectAuditEntries } from '../../../store/slices/auditLogSlice';

/**
 * Custom hook reading the administrative audit log from the Redux auditLog slice.
 * New entries are written by the admin thunks themselves (addAuditEntry).
 */
export default function useAuditLog() {
  const dispatch = useDispatch();
  const auditLog = useSelector(selectAuditEntries);

  const refreshAuditLog = useCallback(() => dispatch(fetchAuditLog()), [dispatch]);

  // Initial load once on mount
  useEffect(() => {
    refreshAuditLog();
  }, [refreshAuditLog]);

  return { auditLog, refreshAuditLog };
}
