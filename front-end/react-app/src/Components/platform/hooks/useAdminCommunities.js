import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCommunities,
  suspendCommunity as suspendCommunityThunk,
  reinstateCommunity as reinstateCommunityThunk,
  selectAdminCommunities,
} from '../../../store/slices/adminCommunitiesSlice';

/**
 * Custom hook connecting the Communities tab to the Redux adminCommunities slice.
 * Adds the reason prompt / confirmation and the toasts around the thunks.
 */
export default function useAdminCommunities(showToast) {
  const dispatch = useDispatch();
  const communities = useSelector(selectAdminCommunities);

  const refreshCommunities = useCallback(() => dispatch(fetchCommunities()), [dispatch]);

  // Initial load once on mount
  useEffect(() => {
    refreshCommunities();
  }, [refreshCommunities]);

  const nameOf = (communityId) =>
    communities.find((c) => c.id === communityId)?.name || `community #${communityId}`;

  const suspendCommunity = async (communityId, reason) => {
    const r = reason || window.prompt(`Reason for suspending "${nameOf(communityId)}":`);
    if (!r?.trim()) return;
    try {
      await dispatch(suspendCommunityThunk({ communityId, reason: r.trim() })).unwrap();
      showToast('⚠️ Community suspended');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const reinstateCommunity = async (communityId) => {
    if (!window.confirm(`Reinstate "${nameOf(communityId)}"?`)) return;
    try {
      await dispatch(reinstateCommunityThunk(communityId)).unwrap();
      showToast('✓ Community reinstated');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  return {
    communities,
    refreshCommunities,
    suspendCommunity,
    reinstateCommunity,
  };
}
