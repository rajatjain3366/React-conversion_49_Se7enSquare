import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_CHANNELS, EMOJIS } from '../data/chatData';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { toastShown } from '../../../store/slices/uiSlice';
import {
  fetchChatChannels,
  fetchChatMembers,
  fetchChatMessages,
  sendChatMessage,
  toggleChatReaction,
  chatCleared,
  selectChat,
} from '../../../store/slices/chatSlice';

// Shown when the page is opened without ?community=
const NO_COMMUNITY_CHANNEL = { id: 'general', name: 'general', topic: 'The main hub 👋' };

function toChatUser(raw) {
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

/**
 * Connects the Chat page to the Redux chat slice (channels, members, messages).
 * The active channel, input box, search and panel toggles are page-only UI state.
 */
export default function useChat() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const communityId    = searchParams.get('community') || '';
  const communityName  = decodeURIComponent(searchParams.get('cname')   || 'Community Chat');
  const initialChannel = decodeURIComponent(searchParams.get('channel') || 'general');

  const messagesEndRef = useRef(null);
  const user = toChatUser(useSelector(selectCurrentUser));
  const { channels, channelsLoading, members, messages } = useSelector(selectChat);

  const [selectedChannel, setActiveChannel] = useState(
    () => DEFAULT_CHANNELS.find(c => c.name === initialChannel) || DEFAULT_CHANNELS[0]
  );
  const activeChannel = communityId ? selectedChannel : NO_COMMUNITY_CHANNEL;
  const loading = communityId ? channelsLoading : false;

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

  const showToast = (msg) => dispatch(toastShown({ msg }));

  // Channels and members of this community
  useEffect(() => {
    if (!communityId) {
      dispatch(chatCleared());
      return;
    }
    let cancelled = false;
    dispatch(fetchChatChannels(communityId)).unwrap()
      .then((parsed) => {
        if (cancelled) return;
        setActiveChannel(parsed.length > 0
          ? parsed.find(c => c.name === initialChannel || c.id === initialChannel) || parsed[0]
          : { id: 'general', name: 'general', topic: 'General discussion' });
      })
      .catch(() => { /* keep the default channels */ });
    dispatch(fetchChatMembers(communityId));
    return () => { cancelled = true; };
  }, [dispatch, communityId, initialChannel]);

  // Messages of the active channel of THIS community
  useEffect(() => {
    if (!communityId || !activeChannel?.id) return;
    dispatch(fetchChatMessages({ communityId, channelId: activeChannel.id }));
  }, [dispatch, communityId, activeChannel?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = msgInput.trim();
    // Every message must belong to a real community. Before, a missing
    // communityId fell back to community 1, so messages ended up there.
    if (!text || !activeChannel?.id || !communityId) return;

    const content = replyTo ? `↩️ ${replyTo}: ${text}` : text;
    setMsgInput('');
    setReplyTo(null);

    try {
      await dispatch(sendChatMessage({
        communityId,
        channelId: activeChannel.id,
        content,
        authorName: user.username || user.firstName || 'User',
        sentAt: new Date().toISOString(),
      })).unwrap();
    } catch (err) {
      // The slice has removed the message again; give the text back to retry
      setMsgInput(prev => prev || text);
      showToast(`⚠️ Message not sent: ${err.message}`);
    }
  };

  const toggleReaction = async (msgId, emoji) => {
    try {
      await dispatch(toggleChatReaction({ msgId, emoji, actorName: user.username || user.firstName })).unwrap();
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
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
