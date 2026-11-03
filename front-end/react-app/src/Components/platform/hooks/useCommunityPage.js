import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toastShown } from '../../../store/slices/uiSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  fetchCommunityPage,
  fetchCommunityExtras,
  fetchMyMemberships,
  joinCommunity,
  leaveCommunity,
  deleteCommunity,
  selectCurrentCommunity,
  selectJoinedIds,
} from '../../../store/slices/communitiesSlice';

// Demo fallback used only to fill fields the API record doesn't carry.
const DEFAULT_COMMUNITY = {
  icon: '⚡', category: 'Esports · Competitive', founded: 'Mar 2022',
  description: '', tags: [], channels: [], rules: [],
};

// Generic defaults shown until the owner sets real rules via community settings.
const DEFAULT_RULES = [
  'Treat every member with kindness and respect. Personal attacks, harassment, hate speech, and discriminatory language of any kind are strictly prohibited.',
  "Keep discussions relevant to each channel's purpose. Use an off-topic channel for casual conversations.",
  'Unsolicited advertisements, excessive self-promotion, and repetitive posting are not allowed.',
  'When answering questions, be thorough and patient. Encourage learning at every level.',
  'Always credit the original author when sharing code, articles, or other content.',
  'Sharing pirated software, cracked licenses, or any illegal content is grounds for immediate permanent ban.',
  'Moderator decisions are final. If you disagree with an action, use the appeal process rather than arguing in public channels.',
];

// The API returns memberCount/onlineCount.
export const memberCountOf = (c) => c?.memberCount ?? 0;
export const onlineCountOf = (c) => c?.onlineCount ?? 0;

export function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

/**
 * Manages community data fetch, join/leave state, member lists, events,
 * and the delete action for the CommunityPage.
 * The community, its members/events and the joined state come from the shared
 * Redux communities slice, so joining here also shows on Discovery.
 */
export default function useCommunityPage(id, navigate) {
  const dispatch = useDispatch();
  const sessionUser = useSelector(selectCurrentUser);
  const current = useSelector(selectCurrentCommunity);
  const joinedIds = useSelector(selectJoinedIds);

  const user = useMemo(() => ({
    id: sessionUser?.id,
    role: sessionUser?.role || 'user',
    username: sessionUser?.username || 'user',
    firstName: sessionUser?.firstName || sessionUser?.name?.split(' ')[0] || 'User',
  }), [sessionUser]);

  const [activeTab, setActiveTab] = useState('overview');
  const [memberSearch, setMemberSearch] = useState('');

  const showToast = (msg) => dispatch(toastShown({ msg }));

  // The record is merged with the defaults once per load, so effects see a stable object
  const community = useMemo(
    () => (current.community ? { ...DEFAULT_COMMUNITY, ...current.community } : null),
    [current.community]
  );
  const joined = joinedIds.includes(String(id));

  useEffect(() => {
    dispatch(fetchCommunityPage(id));
    dispatch(fetchMyMemberships());
  }, [dispatch, id, user.id]);

  // Members and events are loaded once the community record is known
  useEffect(() => {
    if (community?.id) dispatch(fetchCommunityExtras(community));
  }, [dispatch, community]);

  const toggleJoin = async () => {
    if (!community?.id) return;
    if (!user.id) {
      showToast('⚠️ Please log in to join communities.');
      return;
    }
    try {
      if (joined) {
        await dispatch(leaveCommunity(community.id)).unwrap();
        showToast('Left community.');
      } else {
        await dispatch(joinCommunity(community.id)).unwrap();
        showToast(`Welcome to ${community.name}! 🚀`);
      }
    } catch (err) {
      // The slice has already undone the optimistic change
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!community?.id) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${community.name}"? This action cannot be undone.`)) return;
    try {
      await dispatch(deleteCommunity(community.id)).unwrap();
    } catch (err) {
      showToast(`⚠️ Could not delete community: ${err.message}`);
      return;
    }
    showToast('🗑️ Community deleted.');
    setTimeout(() => navigate('/discovery'), 600);
  };

  // Owner gate: compare against the community record's ownerId from the server,
  // or grant admin full access.
  const isOwner =
    (user.id && String(community?.ownerId) === String(user.id)) ||
    user.role === 'admin';

  // Channels come from the record's channels, falling back to tags.
  const rawChannels = community?.channels?.length ? community.channels : (community?.tags || []);
  const channelEntries = rawChannels.map((item) =>
    typeof item === 'object' ? item : { name: item, type: 'Text' }
  );

  const foundedLabel = community?.createdAt
    ? new Date(community.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : community?.founded;

  const rules = community?.rules?.length ? community.rules : DEFAULT_RULES;

  const members = current.members;
  const filteredMembers = (members || []).filter((m) =>
    !memberSearch ||
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    String(m.userId) === memberSearch.trim()
  );

  return {
    user,
    community, loading: current.loading, loadError: current.error,
    activeTab, setActiveTab,
    joined, toggleJoin,
    memberSearch, setMemberSearch,
    members, events: current.events,
    isOwner,
    channelEntries, foundedLabel, rules, filteredMembers,
    showToast,
    handleDelete,
  };
}
