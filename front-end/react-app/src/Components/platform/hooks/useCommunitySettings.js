import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { DEFAULT_COMMUNITY } from '../data/defaultCommunityData';
import useDirtyForm from './useDirtyForm';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getStoredUser() {
  try {
    const raw = localStorage.getItem('nexus_user') || localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}


/**
 * Custom hook encapsulating CommunitySettings state, network fetch/save, and modal actions.
 */
export default function useCommunitySettings() {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const communityId = paramId || searchParams.get('id') || '1';

  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const { isDirty, setIsDirty, markDirty, markClean } = useDirtyForm(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Community state with snapshot for discard
  const [community, setCommunity] = useState(DEFAULT_COMMUNITY);
  const [initialCommunity, setInitialCommunity] = useState(DEFAULT_COMMUNITY);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newChName, setNewChName] = useState('');
  const [newChType, setNewChType] = useState('Text');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    async function loadCommunity() {
      try {
        const su = getStoredUser();
        const authHeaders = {
          'x-role': su?.role || 'user',
          ...(su?.id ? { 'x-user-id': String(su.id) } : {}),
        };
        const [commRes, memsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/communities/${communityId}`, { headers: authHeaders }),
          fetch(`${API_BASE}/memberships?communityId=${communityId}`, { headers: authHeaders }),
          fetch(`${API_BASE}/users?communityId=${communityId}`, { headers: authHeaders }),
        ]);
        if (commRes.ok) {
          const data = await commRes.json();
          let membersList = [];
          if (memsRes.ok && usersRes.ok) {
            const mems = await memsRes.json();
            const usrs = await usersRes.json();
            const usersById = new Map((Array.isArray(usrs) ? usrs : []).map(u => [String(u.id), u]));
            membersList = (Array.isArray(mems) ? mems : []).map(m => {
              const u = usersById.get(String(m.userId)) || {};
              const uName = u.fullName || u.name || u.username || `User #${m.userId}`;
              return {
                id: m.id,
                userId: m.userId,
                name: uName,
                handle: `@${u.username || 'user'}`,
                role: u.id === data.ownerId ? 'Owner' : (u.role || 'Member'),
                initials: uName.slice(0, 2).toUpperCase(),
              };
            });
          }
          const loaded = {
            ...DEFAULT_COMMUNITY,
            ...data,
            members: membersList,
            rules: Array.isArray(data.rules)
              ? data.rules.join('\n')
              : data.rules || DEFAULT_COMMUNITY.rules,
            channels: Array.isArray(data.channels)
              ? data.channels.map((ch, idx) =>
                  typeof ch === 'string' ? { id: idx + 1, name: ch, type: 'Text' } : ch
                )
              : DEFAULT_COMMUNITY.channels,
          };
          setCommunity(loaded);
          setInitialCommunity(loaded);
        }
      } catch {
        // use fallback
      }
      setLoading(false);
    }
    loadCommunity();
  }, [communityId]);

  const handleFieldChange = (field, value) => {
    setCommunity((prev) => ({ ...prev, [field]: value }));
    markDirty();
  };

  const handleMemberRoleChange = (memberId, newRole) => {
    setCommunity((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    }));
    markDirty();
    showToast(`Role updated to ${newRole}`);
  };

  const handleRemoveMember = async (memberId) => {
    // Immediately delete the membership on the backend
    const su = getStoredUser();
    const authHeaders = {
      'x-role': su?.role || 'user',
      ...(su?.id ? { 'x-user-id': String(su.id) } : {}),
    };
    try {
      const res = await fetch(`${API_BASE}/memberships/${memberId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(`⚠️ ${body?.message || 'Could not remove member'}`);
        return;
      }
    } catch {
      showToast('⚠️ Could not reach the backend');
      return;
    }
    setCommunity((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
    }));
    showToast('✅ Member removed');
  };

  const handleDeleteChannel = (channelId) => {
    setCommunity((prev) => ({
      ...prev,
      channels: prev.channels.filter((c) => c.id !== channelId),
    }));
    markDirty();
    showToast('Channel deleted');
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChName.trim()) {
      showToast('⚠️ Channel name is required');
      return;
    }
    const cleanName = newChName.trim().toLowerCase().replace(/\s+/g, '-');
    setCommunity((prev) => ({
      ...prev,
      channels: [...prev.channels, { id: Date.now(), name: cleanName, type: newChType }],
    }));
    setNewChName('');
    setModalOpen(false);
    markDirty();
    showToast(`Channel #${cleanName} created`);
  };

  // Upload the image to POST /api/uploads first and keep only the short URL
  // it returns (e.g. "/uploads/abc.png"). Previously the whole image was put
  // in `banner` as a base64 string, which the backend DTO rejects (max 300
  // chars), so Save failed with 400.
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const su = getStoredUser();
    const upload = new FormData();
    upload.append('file', file);
    try {
      // No Content-Type header: the browser sets the multipart boundary itself.
      const res = await fetch(`${API_BASE}/uploads`, {
        method: 'POST',
        headers: {
          'x-role': su?.role || 'user',
          ...(su?.id ? { 'x-user-id': String(su.id) } : {}),
        },
        body: upload,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(`⚠️ ${body?.message || 'Banner upload failed'}`);
        return;
      }
      const { fileUrl } = await res.json();
      handleFieldChange('banner', fileUrl);
      showToast('📷 Banner updated! Save to persist.');
    } catch {
      showToast('⚠️ Could not reach the backend');
    }
  };

  const saveSettings = async () => {
    const su = getStoredUser();
    const authHeaders = {
      'Content-Type': 'application/json',
      'x-role': su?.role || 'user',
      ...(su?.id ? { 'x-user-id': String(su.id) } : {}),
    };
    try {
      const parsedRules = Array.isArray(community.rules)
        ? community.rules
        : typeof community.rules === 'string'
        ? community.rules.split('\n').map((r) => r.trim()).filter(Boolean)
        : undefined;

      // Normalise channels to plain objects the backend can store
      const parsedChannels = Array.isArray(community.channels)
        ? community.channels.map((ch, idx) => ({
            id: ch.id ? String(ch.id) : (ch.name ? String(ch.name) : String(idx + 1)),
            name: typeof ch === 'string' ? ch : ch.name,
            type: (typeof ch === 'object' && ch.type) || 'Text',
            topic: (typeof ch === 'object' && ch.topic) || `#${typeof ch === 'string' ? ch : ch.name} channel`,
          }))
        : undefined;

      const res = await fetch(`${API_BASE}/communities/${communityId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          name: community.name,
          description: community.description,
          banner: community.banner || undefined,
          rules: parsedRules,
          channels: parsedChannels,
        }),
      });

      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try { const body = await res.json(); msg = body?.message || msg; } catch { /* ignore */ }
        showToast(`⚠️ ${msg}`);
        return;
      }

      const saved = await res.json().catch(() => null);
      if (saved) {
        const updated = {
          ...community,
          ...saved,
          rules: Array.isArray(saved.rules) ? saved.rules.join('\n') : (saved.rules || community.rules),
          channels: Array.isArray(saved.channels) ? saved.channels : community.channels,
        };
        setCommunity(updated);
        setInitialCommunity(updated);
      } else {
        setInitialCommunity({ ...community });
      }

      showToast('✅ Community settings saved successfully!');
      markClean();
    } catch (err) {
      showToast(`⚠️ ${err.message || 'Could not save settings'}`);
    }
  };

  const discardSettings = () => {
    setCommunity(initialCommunity);
    markClean();
    showToast('Changes discarded.');
  };

  return {
    communityId,
    activeTab,
    setActiveTab,
    loading,
    isDirty,
    setIsDirty,
    community,
    modalOpen,
    setModalOpen,
    newChName,
    setNewChName,
    newChType,
    setNewChType,
    toastMsg,
    handleFieldChange,
    handleMemberRoleChange,
    handleRemoveMember,
    handleDeleteChannel,
    handleCreateChannel,
    handleBannerUpload,
    saveSettings,
    discardSettings,
  };
}
