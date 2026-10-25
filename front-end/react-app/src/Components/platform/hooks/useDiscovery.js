import { useState, useEffect, useMemo } from 'react';
import { memberCountOf, onlineCountOf } from '../data/discoveryData';

import { apiRequest, getStoredUser } from '../../../services/api';


function getJoinedIdList() {
  try {
    const list = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    return Array.isArray(list) ? list.map(String) : [];
  } catch { return []; }
}

function setJoinedIdList(idStr, joined) {
  const next = joined
    ? [...new Set([...getJoinedIdList(), idStr])]
    : getJoinedIdList().filter(x => x !== idStr);
  localStorage.setItem('nexus_joined_communities', JSON.stringify(next));
}

/**
 * Manages community listings, search/category filters, sorting, and
 * join/leave toggling for the Discovery page.
 */
export default function useDiscovery() {
  const [communities, setCommunities] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('active');
  const [showSort, setShowSort] = useState(false);
  const [joinedIds, setJoinedIds] = useState(() => new Set(getJoinedIdList()));
  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState('');
  const [eventCount, setEventCount] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((cur) => (cur === msg ? null : cur)), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      const user = getStoredUser();

      // --- 1. Fetch communities (primary) ---
      try {
        const data = await apiRequest('/communities');
        if (cancelled) return;
        // Filter out suspended communities — they must not appear on the discovery page
        const activeCommunities = Array.isArray(data)
          ? data.filter(c => (c.status || 'active').toLowerCase() !== 'suspended')
          : [];
        setCommunities(activeCommunities);
        setLoadWarning('');
      } catch (err) {
        if (!cancelled) {
          setCommunities([]);
          setLoadWarning(err.message || 'Could not load communities.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      // --- 2. Fetch memberships independently (non-critical) ---
      if (user?.id) {
        try {
          const mems = await apiRequest(`/memberships?userId=${user.id}`);
          if (!cancelled && Array.isArray(mems)) {
            const ids = new Set(getJoinedIdList());
            mems.forEach(m => ids.add(String(m.communityId)));
            if (!cancelled) setJoinedIds(ids);
          }
        } catch { /* ignore — user just won't see server-side joined state */ }
      }

      // --- 3. Fetch events independently (non-critical) ---
      try {
        const events = await apiRequest('/events');
        if (Array.isArray(events) && !cancelled) setEventCount(events.length);
      } catch { /* ignore — event count stays null */ }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

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
        const notSuspended = (c.status || 'active').toLowerCase() !== 'suspended';
        return matchSearch && matchCat && notSuspended;
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
    const user = getStoredUser();
    if (!user || user.id === undefined || user.id === null) {
      showToast('⚠️ Please log in to join communities.');
      return;
    }
    const idStr = String(id);
    const isJoined = joinedIds.has(idStr);

    // Optimistic UI + localStorage update, reverted on real failures.
    setJoinedIds(prev => {
      const next = new Set(prev);
      if (isJoined) next.delete(idStr); else next.add(idStr);
      return next;
    });
    setJoinedIdList(idStr, !isJoined);

    try {
      if (isJoined) {
        const mems = await apiRequest(`/memberships?userId=${user.id}`);
        const target = Array.isArray(mems)
          ? mems.find(m => String(m.communityId) === idStr && String(m.userId) === String(user.id))
          : null;
        if (target) {
          await apiRequest(`/memberships/${target.id}`, { method: 'DELETE' });
        }
        showToast('Left community.');
      } else {
        try {
          await apiRequest('/memberships', {
            method: 'POST',
            body: JSON.stringify({ userId: Number(user.id), communityId: Number(id) }),
          });
        } catch (postErr) {
          if (!/already a member/i.test(postErr.message)) throw postErr;
        }
        const comm = communities.find(c => String(c.id) === idStr);
        showToast(comm ? `Welcome to ${comm.name}! ⚡` : 'Joined community.');
      }
    } catch (err) {
      setJoinedIds(prev => {
        const next = new Set(prev);
        if (isJoined) next.add(idStr); else next.delete(idStr);
        return next;
      });
      setJoinedIdList(idStr, isJoined);
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
    toastMsg,
  };
}
