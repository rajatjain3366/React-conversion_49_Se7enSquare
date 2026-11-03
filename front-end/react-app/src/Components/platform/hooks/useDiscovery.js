import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toastShown } from '../../../store/slices/uiSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  fetchCommunityList,
  fetchMyMemberships,
  joinCommunity,
  leaveCommunity,
  selectCommunityList,
  selectCommunityListLoading,
  selectCommunityListError,
  selectJoinedIds,
} from '../../../store/slices/communitiesSlice';
import { memberCountOf, onlineCountOf } from '../data/discoveryData';
import { apiRequest } from '../../../services/api';

/**
 * Manages community listings, search/category filters, sorting, and
 * join/leave toggling for the Discovery page.
 * Communities and joined ids come from the shared Redux communities slice;
 * the search, category and sort controls are page-only UI state.
 */
export default function useDiscovery() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const communities = useSelector(selectCommunityList);
  const loading = useSelector(selectCommunityListLoading);
  const loadWarning = useSelector(selectCommunityListError);
  const joinedIdList = useSelector(selectJoinedIds);
  const joinedIds = useMemo(() => new Set(joinedIdList), [joinedIdList]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('active');
  const [showSort, setShowSort] = useState(false);
  const [eventCount, setEventCount] = useState(null);

  const showToast = (msg) => dispatch(toastShown({ msg }));

  useEffect(() => {
    dispatch(fetchCommunityList());
    dispatch(fetchMyMemberships());

    // Event count for the stats bar (non-critical)
    let cancelled = false;
    apiRequest('/events')
      .then((events) => { if (!cancelled && Array.isArray(events)) setEventCount(events.length); })
      .catch(() => { /* event count stays null */ });
    return () => { cancelled = true; };
  }, [dispatch]);

  const categories = useMemo(() => {
    const cats = [];
    communities.forEach(c => {
      if (c.category && !cats.includes(c.category)) cats.push(c.category);
    });
    return ['All', ...cats];
  }, [communities]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const cat = activeCategory.toLowerCase();
    return communities
      .filter(c => {
        const matchSearch = !q ||
          c.name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q);
        const matchCat = activeCategory === 'All' ||
          (c.category || '').toLowerCase() === cat ||
          (c.tags || []).some(t => String(t).toLowerCase() === cat);
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        if (sortBy === 'members') return memberCountOf(b) - memberCountOf(a);
        if (sortBy === 'trending') {
          return (onlineCountOf(b) / Math.max(memberCountOf(b), 1)) -
                 (onlineCountOf(a) / Math.max(memberCountOf(a), 1));
        }
        if (sortBy === 'newest') {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (tb - ta) || ((b.id || 0) - (a.id || 0));
        }
        return onlineCountOf(b) - onlineCountOf(a); // most active default
      });
  }, [communities, search, activeCategory, sortBy]);

  const totalMembers = communities.reduce((s, c) => s + memberCountOf(c), 0);
  const totalOnline = communities.reduce((s, c) => s + onlineCountOf(c), 0);

  const toggleJoin = async (id, e) => {
    e.stopPropagation();
    if (!user || user.id === undefined || user.id === null) {
      showToast('⚠️ Please log in to join communities.');
      return;
    }
    const idStr = String(id);
    try {
      if (joinedIds.has(idStr)) {
        await dispatch(leaveCommunity(idStr)).unwrap();
        showToast('Left community.');
      } else {
        await dispatch(joinCommunity(idStr)).unwrap();
        const comm = communities.find(c => String(c.id) === idStr);
        showToast(comm ? `Welcome to ${comm.name}! ⚡` : 'Joined community.');
      }
    } catch (err) {
      // The slice has already undone the optimistic change
      showToast(`⚠️ ${err.message}`);
    }
  };

  return {
    communities, loading, loadWarning,
    search, setSearch,
    activeCategory, setActiveCategory,
    sortBy, setSortBy,
    showSort, setShowSort,
    joinedIds, toggleJoin,
    categories, filtered,
    totalMembers, totalOnline, eventCount,
  };
}
