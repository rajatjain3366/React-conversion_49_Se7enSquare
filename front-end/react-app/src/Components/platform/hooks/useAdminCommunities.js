import { useState, useCallback, useEffect, useRef } from 'react';
import { apiRequest } from '../../../services/api';

/**
 * Manages community list fetch and admin suspend/reinstate actions.
 * POST /admin/communities/:id/suspend|reinstate from AdminCommunitiesController.
 * Each successful action is reported to onAudit.
 */
export default function useAdminCommunities(showToast, onAudit) {
  const [communities, setCommunities] = useState([]);
  const showToastRef = useRef(showToast);
  const onAuditRef = useRef(onAudit);
  useEffect(() => {
    showToastRef.current = showToast;
    onAuditRef.current = onAudit;
  }, [showToast, onAudit]);

  const refreshCommunities = useCallback(async () => {
    try {
      const data = await apiRequest('/communities');
      setCommunities(Array.isArray(data) ? data : []);
    } catch { /* leave current list */ }
  }, []);

  // Initial load once on mount
  useEffect(() => {
    refreshCommunities();
  }, [refreshCommunities]);

  const suspendCommunity = useCallback(async (communityId, reason) => {
    const community = communities.find((c) => c.id === communityId);
    const r = reason || window.prompt(`Reason for suspending "${community?.name || `community #${communityId}`}":`);
    if (!r?.trim()) return;
    try {
      await apiRequest(`/admin/communities/${communityId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason: r.trim() }),
      });
      showToastRef.current?.(`⚠️ Community suspended`);
      onAuditRef.current?.('Community Suspended', community?.name || `community #${communityId}`, r.trim());
      await refreshCommunities();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [communities, refreshCommunities]);

  const reinstateCommunity = useCallback(async (communityId) => {
    const community = communities.find((c) => c.id === communityId);
    if (!window.confirm(`Reinstate "${community?.name || `community #${communityId}`}"?`)) return;
    try {
      await apiRequest(`/admin/communities/${communityId}/reinstate`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Reinstated by admin' }),
      });
      showToastRef.current?.('✓ Community reinstated');
      onAuditRef.current?.('Community Reinstated', community?.name || `community #${communityId}`, 'Reinstated by admin');
      await refreshCommunities();
    } catch (err) {
      showToastRef.current?.(`❌ ${err.message}`);
    }
  }, [communities, refreshCommunities]);

  return {
    communities,
    setCommunities,
    refreshCommunities,
    suspendCommunity,
    reinstateCommunity,
  };
}
