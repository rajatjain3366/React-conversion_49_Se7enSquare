import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_CHANNELS, EMOJIS } from '../data/chatData';

import { apiRequest, getStoredUser } from '../../../services/api';

function getUser() {
  const raw = getStoredUser();
  if (!raw) {
    return { id: null, name: 'User', fullName: 'User', firstName: 'User', username: 'user', initials: 'U', role: 'user' };
  }
  const name = raw.fullName || raw.name || (raw.firstName ? `${raw.firstName} ${raw.lastName || ''}`.trim() : raw.username || 'User');
  return {
    id: raw.id,
    name,
    fullName: name,
    firstName: raw.firstName || raw.username || 'User',
    username: raw.username || 'user',
    initials: (raw.firstName ? raw.firstName.slice(0, 1) + (raw.lastName ? raw.lastName.slice(0, 1) : '') : (name || 'U')).slice(0, 2).toUpperCase(),
    role: raw.role || 'user',
  };
}

// Backend stores reactions as { "👍": [userId, userId, ...] } (who reacted).
// The count is the array length. Emojis with nobody left are hidden.
function toReactionList(reactions) {
  if (!reactions || typeof reactions !== 'object') return [];
  return Object.entries(reactions)
    .map(([emoji, userIds]) => ({ emoji, count: Array.isArray(userIds) ? userIds.length : 0 }))
    .filter((r) => r.count > 0);
}

/**
 * Manages all state, effects, and handlers for the Chat page.
 * Returns state and callbacks for the channel sidebar, message feed, input area, etc.
 */
export default function useChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const communityId    = searchParams.get('community') || '';
  const communityName  = decodeURIComponent(searchParams.get('cname')   || 'Community Chat');
  const initialChannel = decodeURIComponent(searchParams.get('channel') || 'general');

  const messagesEndRef = useRef(null);
  const user = getUser();

  const [channels,        setChannels]        = useState(DEFAULT_CHANNELS);
  const [activeChannel,   setActiveChannel]   = useState(
    () => DEFAULT_CHANNELS.find(c => c.name === initialChannel) || DEFAULT_CHANNELS[0]
  );
  const [messages,        setMessages]        = useState([]);
  const [members,         setMembers]         = useState([]);
  const [msgInput,        setMsgInput]        = useState('');
  const [channelSearch,   setChannelSearch]   = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch,      setShowSearch]      = useState(false);
  const [msgSearchQuery,  setMsgSearchQuery]  = useState('');
  const [showPinned,      setShowPinned]      = useState(false);
  const [showMembers,     setShowMembers]     = useState(true);
  const [replyTo,         setReplyTo]         = useState(null);
  const [muted,           setMuted]           = useState(false);
  const [deafened,        setDeafened]        = useState(false);
  const [loading,         setLoading]         = useState(true);

  // Fetch community channels from backend
  useEffect(() => {
    async function fetchChannels() {
      if (!communityId) {
        setActiveChannel({ id: 'general', name: 'general', topic: 'The main hub 👋' });
        setLoading(false);
        return;
      }
      try {
        const comm = await apiRequest(`/communities/${communityId}`);
        if (comm && Array.isArray(comm.channels) && comm.channels.length > 0) {
          const parsed = comm.channels.map((c, idx) => ({
            id:    typeof c === 'string' ? c : c.id || c.name || String(idx + 1),
            name:  typeof c === 'string' ? c : c.name,
            topic: typeof c === 'object' && c.topic ? c.topic : `#${typeof c === 'string' ? c : c.name} channel`,
          }));
          setChannels(parsed);
          const found = parsed.find(c => c.name === initialChannel || c.id === initialChannel) || parsed[0];
          if (found) setActiveChannel(found);
        } else {
          setActiveChannel({ id: 'general', name: 'general', topic: 'General discussion' });
        }
      } catch {}
      setLoading(false);
    }
    fetchChannels();
  }, [communityId, user.role, initialChannel]);

  // Fetch community members
  useEffect(() => {
    async function fetchMembers() {
      if (!communityId) {
        setMembers([]);
        return;
      }
      try {
        const [mems, usrs] = await Promise.all([
          apiRequest(`/memberships?communityId=${communityId}`),
          apiRequest(`/users?communityId=${communityId}`),
        ]);
        const userMap = new Map((Array.isArray(usrs) ? usrs : []).map(u => [String(u.id), u]));
        const mappedMembers = (Array.isArray(mems) ? mems : []).map(m => {
          const u = userMap.get(String(m.userId)) || {};
          const mName = u.fullName || u.username || `User #${m.userId}`;
          return {
            name: mName,
            userId: m.userId,
            avatar: u.avatar,
            role: u.role || 'Member',
            status: u.status || 'active',
            initials: mName.slice(0, 2).toUpperCase(),
            color: '#6366f1',
          };
        });
        setMembers(mappedMembers);
      } catch {
        setMembers([]);
      }
    }
    fetchMembers();
  }, [communityId, user.role]);

  // Fetch messages for the active channel of THIS community.
  // Channel ids like "general" exist in every community, so we filter by
  // both communityId and channelId (GET /messages?communityId=&channelId=).
  // The old call /channels/:id/messages filtered by channel only and mixed
  // messages from all communities.
  useEffect(() => {
    async function fetchMessages() {
      if (!activeChannel?.id) return;
      if (!communityId) {
        setMessages([]); // no community selected -> nothing to show
        return;
      }
      try {
        const data = await apiRequest(
          `/messages?communityId=${encodeURIComponent(communityId)}&channelId=${encodeURIComponent(activeChannel.id)}`
        );
        if (Array.isArray(data)) {
          setMessages(data.map(m => {
            const reactionsArr = toReactionList(m.reactions);
            const authorName = m.authorName || m.author?.name || m.author || 'User';
            return {
              id:        m.id,
              author:    authorName,
              initials:  authorName.slice(0, 2).toUpperCase(),
              color:     '#6366f1',
              text:      m.content || '',
              time:      m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
              reactions: reactionsArr,
            };
          }));
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      }
    }
    fetchMessages();
  }, [activeChannel?.id, communityId, user.role]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = msgInput.trim();
    // Every message must belong to a real community. Before, a missing
    // communityId fell back to community 1, so messages ended up there.
    if (!text || !activeChannel?.id || !communityId) return;

    const fullContent  = replyTo ? `↩️ ${replyTo}: ${text}` : text;
    const authorName   = user.username || user.firstName || 'User';
    const tempMsg = {
      id:        Date.now(),
      author:    authorName,
      initials:  authorName.slice(0, 2).toUpperCase(),
      color:     '#34d399',
      text:      fullContent,
      time:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };

    setMessages(prev => [...prev, tempMsg]);
    setMsgInput('');
    setReplyTo(null);

    try {
      const created = await apiRequest('/messages', {
        method:  'POST',
        body:    JSON.stringify({
          channelId:  String(activeChannel.id),
          content:    fullContent,
          communityId: Number(communityId),
          authorId:   user?.id ? Number(user.id) : undefined,
          authorName,
        }),
      });
      if (created && created.id) {
        setMessages(prev =>
          prev.map(m => m.id === tempMsg.id ? { ...m, id: created.id } : m)
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // The backend toggles: first click adds your reaction, second click removes
  // it. It returns the updated message, so we show its real reaction counts
  // instead of guessing "+1" locally.
  const toggleReaction = async (msgId, emoji) => {
    try {
      const updated = await apiRequest(`/messages/${msgId}/reactions`, {
        method:  'POST',
        body:    JSON.stringify({
          emoji,
          actorId:   user?.id ? Number(user.id) : undefined,
          actorName: user.username || user.firstName,
        }),
      });
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, reactions: toReactionList(updated?.reactions) } : m
      ));
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const filteredChannels = channels.filter(c =>
    !channelSearch || c.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const filteredMessages = msgSearchQuery
    ? messages.filter(m => m.text.toLowerCase().includes(msgSearchQuery.toLowerCase()))
    : messages;

  return {
    // Identity / routing
    navigate, user, communityId, communityName,
    // Refs
    messagesEndRef,
    // Channel state
    channels, loading, activeChannel, setActiveChannel,
    channelSearch, setChannelSearch,
    filteredChannels,
    // Message state
    messages, filteredMessages,
    members,
    msgInput, setMsgInput,
    msgSearchQuery, setMsgSearchQuery,
    replyTo, setReplyTo,
    // UI toggles
    showEmojiPicker, setShowEmojiPicker,
    showSearch, setShowSearch,
    showPinned, setShowPinned,
    showMembers, setShowMembers,
    muted, setMuted,
    deafened, setDeafened,
    // Actions
    sendMessage, toggleReaction,
    EMOJIS,
  };
}
