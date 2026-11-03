import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  fetchCommunityList,
  fetchMyMemberships,
  selectAllCommunities,
  selectJoinedCommunities,
  selectOwnedCommunities,
  selectCommunityListLoading,
} from '../../../store/slices/communitiesSlice';
import { fetchEvents, selectApprovedEvents } from '../../../store/slices/eventsSlice';
import {
  fetchNotifications,
  markAllNotificationsRead,
  selectRecentNotifications,
  selectUnreadCount,
} from '../../../store/slices/notificationsSlice';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Connects the Dashboard to Redux. Communities and events come from the shared
 * communities and events slices (also used by Discovery and Events), notifications
 * from the notifications slice. Only the search box is page-only state.
 */
export default function useDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sessionUser = useSelector(selectCurrentUser);
  const user = useMemo(() => ({
    id: sessionUser?.id,
    firstName: sessionUser?.firstName || sessionUser?.username || 'User',
    lastName: sessionUser?.lastName || '',
    username: sessionUser?.username || '',
    role: sessionUser?.role || 'user',
  }), [sessionUser]);

  const allCommunities = useSelector(selectAllCommunities);
  const communities = useSelector(selectJoinedCommunities).slice(0, 8);
  const createdCommunities = useSelector(selectOwnedCommunities).slice(0, 8);
  const loading = useSelector(selectCommunityListLoading);
  const approvedEvents = useSelector(selectApprovedEvents);
  const notifications = useSelector(selectRecentNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const fetchData = useCallback(() => {
    if (sessionUser?.id === undefined || sessionUser?.id === null) {
      navigate('/login');
      return;
    }
    dispatch(fetchCommunityList());
    dispatch(fetchMyMemberships());
    dispatch(fetchEvents());
    dispatch(fetchNotifications());
  }, [dispatch, navigate, sessionUser?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Only approved events are public; the next 4 shaped for the Upcoming Events list
  const events = useMemo(() => approvedEvents.slice(0, 4).map((e) => ({
    id: e.id,
    title: e.title,
    community: allCommunities.find((c) => String(c.id) === String(e.communityId))?.name || 'Community',
    date: e.date
      ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'TBD',
    time: e.time || '',
    type: '📅',
  })), [approvedEvents, allCommunities]);

  const handleSearch = (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setShowSearch(false);
      return;
    }
    const lower = val.toLowerCase();
    const allComms = [...communities, ...createdCommunities];
    const results = [
      ...allComms
        .filter((c) => c.name?.toLowerCase().includes(lower))
        .map((c) => ({ type: 'community', id: c.id, label: c.name, icon: c.icon || '🏘️' })),
      ...events
        .filter((e) => e.title?.toLowerCase().includes(lower))
        .map((e) => ({ type: 'event', id: e.id, label: e.title, icon: '📅' })),
    ];
    setSearchResults(results.slice(0, 6));
    setShowSearch(true);
  };

  const markAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  return {
    navigate,
    user,
    greeting: getGreeting(),
    communities,
    createdCommunities,
    notifications,
    events,
    unreadCount,
    searchQuery,
    searchResults,
    showSearch,
    setShowSearch,
    handleSearch,
    markAllRead,
    loading,
    refresh: fetchData,
  };
}
