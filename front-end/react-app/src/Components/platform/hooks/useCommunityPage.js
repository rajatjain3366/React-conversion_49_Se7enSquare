import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toastShown } from '../../../store/slices/uiSlice';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getUser() {
  try {
    const raw = JSON.parse(
      localStorage.getItem('user') ||
      localStorage.getItem('nexus_user') ||
      localStorage.getItem('currentUser') ||
      '{}'
    );
    return {
      id: raw.id,
      role: raw.role || 'user',
      username: raw.username || 'user',
      firstName: raw.firstName || raw.name?.split(' ')[0] || 'User',
    };
  } catch {
    return { role: 'user', username: 'user', firstName: 'User' };
  }
}

function getJoinedIdList() {
  try {
    const list = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    return Array.isArray(list) ? list.map(String) : [];
  } catch { return []; }
}

function setJoinedIdList(idStr, joined) {
  const current = getJoinedIdList();
  const next = joined
    ? [...new Set([...current, idStr])]
    : current.filter(x => x !== idStr);
  localStorage.setItem('nexus_joined_communities', JSON.stringify(next));
}

function getOwnedIdList() {
  try {
    const list = JSON.parse(localStorage.getItem('nexus_owned_community_ids') || '[]');
    return Array.isArray(list) ? list.map(String) : [];
  } catch { return []; }
}

async function apiErrorMessage(res) {
  try {
    const body = await res.json();
    const msg = body?.message;
    return Array.isArray(msg) ? msg.join(', ') : (msg || `HTTP ${res.status}`);
  } catch { return `HTTP ${res.status}`; }
}

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
 */
export default function useCommunityPage(id, navigate) {
  const user = getUser();

  const [community, setCommunity] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [joined, setJoined] = useState(() => getJoinedIdList().includes(String(id)));
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState(null); // null = still loading
  const [events, setEvents] = useState([]);
  const dispatch = useDispatch();

  const showToast = (msg) => dispatch(toastShown({ msg }));

  const authHeaders = {
    'x-role': user.role,
    ...(user.id ? { 'x-user-id': String(user.id) } : {}),
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchCommunity() {
      setLoading(true);
      try {
        const commRes = await fetch(`${API_BASE}/communities/${id}`, { headers: authHeaders });
        if (cancelled) return;
        if (commRes.ok) {
          const data = await commRes.json();
          setCommunity({ ...DEFAULT_COMMUNITY, ...data });
          setLoadError('');
        } else {
          setCommunity(null);
          setLoadError(`Could not load community — ${await apiErrorMessage(commRes)}`);
        }
      } catch {
        if (!cancelled) {
          setCommunity(null);
          setLoadError('Could not reach the backend. Is the NestJS server running?');
        }
      }
      if (!cancelled) setLoading(false);

      // Join state: localStorage is the source of truth (same as legacy),
      // reconciled with the server's membership list.
      if (user.id) {
        try {
          const memsRes = await fetch(`${API_BASE}/memberships?userId=${user.id}`, { headers: authHeaders });
          if (!cancelled && memsRes.ok) {
            const mems = await memsRes.json();
            if (Array.isArray(mems)) {
              setJoined(mems.some((m) => String(m.communityId) === String(id)));
            }
          }
        } catch { /* keep localStorage-derived state */ }
      }
    }
    fetchCommunity();
    return () => { cancelled = true; };
  }, [id, user.role, user.id]);

  useEffect(() => {
    let cancelled = false;
    async function fetchPageData() {
      if (!community?.id) return;
      try {
        const eventsRes = await fetch(`${API_BASE}/events`, { headers: authHeaders });
        if (!cancelled && eventsRes.ok) {
          const all = await eventsRes.json();
          if (Array.isArray(all)) {
            setEvents(all.filter((e) =>
              String(e.communityId) === String(community.id) && e.status === 'approved'
            ));
          }
        }
      } catch { /* events section stays empty */ }

      try {
        const [memsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/memberships?communityId=${community.id}`, { headers: authHeaders }),
          fetch(`${API_BASE}/users?communityId=${community.id}`, { headers: authHeaders }),
        ]);
        if (cancelled) return;
        const mems = memsRes.ok ? await memsRes.json() : [];
        const users = usersRes.ok ? await usersRes.json() : [];
        const usersById = new Map((Array.isArray(users) ? users : []).map((u) => [String(u.id), u]));
        setMembers((Array.isArray(mems) ? mems : []).map((m) => {
          const u = usersById.get(String(m.userId));
          const isOwner = u && String(u.id) === String(community.ownerId);
          const isMod = !isOwner && (u?.role === 'moderator' || u?.role === 'community_manager');
          return {
            userId: m.userId,
            name: u ? (u.fullName || u.username) : `User #${m.userId}`,
            avatar: u?.avatar,
            role: isOwner ? 'owner' : (isMod ? 'moderator' : 'member'),
            status: u?.status || 'active',
          };
        }));
      } catch {
        if (!cancelled) setMembers([]);
      }
    }
    fetchPageData();
    return () => { cancelled = true; };
  }, [community, user.role]);

  const toggleJoin = async () => {
    if (!community?.id) return;
    if (!user.id) {
      showToast('⚠️ Please log in to join communities.');
      return;
    }
    const next = !joined;
    setJoined(next);
    setJoinedIdList(String(community.id), next);
    try {
      if (next) {
        const res = await fetch(`${API_BASE}/memberships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-role': user.role, ...(user.id ? { 'x-user-id': String(user.id) } : {}) },
          body: JSON.stringify({ userId: Number(user.id), communityId: Number(community.id) }),
        });
        if (!res.ok) {
          const msg = await apiErrorMessage(res);
          // Duplicate joins are harmless — the membership already exists.
          if (!/already a member/i.test(msg)) throw new Error(msg);
        }
        showToast(`Welcome to ${community.name}! 🚀`);
      } else {
        const memsRes = await fetch(`${API_BASE}/memberships?userId=${user.id}`, { headers: { 'x-role': user.role, ...(user.id ? { 'x-user-id': String(user.id) } : {}) } });
        if (!memsRes.ok) throw new Error(await apiErrorMessage(memsRes));
        const mems = await memsRes.json();
        const target = Array.isArray(mems)
          ? mems.find((m) => String(m.communityId) === String(community.id) && String(m.userId) === String(user.id))
          : null;
        if (target) {
          const delRes = await fetch(`${API_BASE}/memberships/${target.id}`, {
            method: 'DELETE',
            headers: { 'x-role': user.role, ...(user.id ? { 'x-user-id': String(user.id) } : {}) },
          });
          if (!delRes.ok) throw new Error(await apiErrorMessage(delRes));
        }
        showToast('Left community.');
      }
    } catch (err) {
      setJoined(!next);
      setJoinedIdList(String(community.id), !next);
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!community?.id) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${community.name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${community.id}`, {
        method: 'DELETE',
        headers: { 'x-role': user.role, ...(user.id ? { 'x-user-id': String(user.id) } : {}) },
      });
      if (!res.ok) {
        showToast(`⚠️ Could not delete community: ${await apiErrorMessage(res)}`);
        return;
      }
    } catch (err) {
      showToast(`⚠️ Could not reach the backend: ${err.message}`);
      return;
    }
    // Mirror the deletion locally so discovery/settings stop listing it.
    const idStr = String(community.id);
    localStorage.setItem('nexus_owned_community_ids', JSON.stringify(getOwnedIdList().filter((x) => x !== idStr)));
    localStorage.setItem('nexus_joined_communities', JSON.stringify(getJoinedIdList().filter((x) => x !== idStr)));
    showToast('🗑️ Community deleted.');
    setTimeout(() => navigate('/discovery'), 600);
  };

  // Owner gate: compare against the community record's ownerId from the server,
  // or grant admin full access. localStorage is NOT used here — any user could
  // tamper with nexus_owned_community_ids to gain owner UI.
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

  const filteredMembers = (members || []).filter((m) =>
    !memberSearch ||
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    String(m.userId) === memberSearch.trim()
  );

  return {
    user,
    community, loading, loadError,
    activeTab, setActiveTab,
    joined, toggleJoin,
    memberSearch, setMemberSearch,
    members, events,
    isOwner,
    channelEntries, foundedLabel, rules, filteredMembers,
    showToast,
    handleDelete,
  };
}
