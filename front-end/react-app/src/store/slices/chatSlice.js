import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { DEFAULT_CHANNELS } from '../../Components/platform/data/chatData';
import { logout } from './authSlice';

/**
 * Chat slice: channels and members of the open community, and the messages of
 * the open channel. The active channel, input box, search and panel toggles
 * are page-only UI and stay in useChat.
 */

const asArray = (data) => (Array.isArray(data) ? data : []);
const timeOf = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

// Backend stores reactions as { "👍": [userId, userId, ...] } (who reacted).
// The count is the array length. Emojis with nobody left are hidden.
function toReactionList(reactions) {
  if (!reactions || typeof reactions !== 'object') return [];
  return Object.entries(reactions)
    .map(([emoji, userIds]) => ({ emoji, count: Array.isArray(userIds) ? userIds.length : 0 }))
    .filter((r) => r.count > 0);
}

function toMessage(m) {
  const authorName = m.authorName || m.author?.name || m.author || 'User';
  return {
    id: m.id,
    author: authorName,
    initials: authorName.slice(0, 2).toUpperCase(),
    color: '#6366f1',
    text: m.content || '',
    time: timeOf(m.createdAt),
    reactions: toReactionList(m.reactions),
  };
}

// Channels live on the community record. Resolves with [] when it has none.
export const fetchChatChannels = createAsyncThunk('chat/fetchChannels', async (communityId) => {
  const comm = await apiRequest(`/communities/${communityId}`);
  return asArray(comm?.channels).map((c, idx) => ({
    id: typeof c === 'string' ? c : c.id || c.name || String(idx + 1),
    name: typeof c === 'string' ? c : c.name,
    topic: typeof c === 'object' && c.topic ? c.topic : `#${typeof c === 'string' ? c : c.name} channel`,
  }));
});

export const fetchChatMembers = createAsyncThunk('chat/fetchMembers', async (communityId) => {
  const [mems, usrs] = await Promise.all([
    apiRequest(`/memberships?communityId=${communityId}`),
    apiRequest(`/users?communityId=${communityId}`),
  ]);
  const userMap = new Map(asArray(usrs).map((u) => [String(u.id), u]));
  return asArray(mems).map((m) => {
    const u = userMap.get(String(m.userId)) || {};
    const name = u.fullName || u.username || `User #${m.userId}`;
    return {
      name,
      userId: m.userId,
      avatar: u.avatar,
      role: u.role || 'Member',
      status: u.status || 'active',
      initials: name.slice(0, 2).toUpperCase(),
      color: '#6366f1',
    };
  });
});

// Channel ids like "general" exist in every community, so filter by both
// communityId and channelId, or messages from all communities get mixed.
export const fetchChatMessages = createAsyncThunk('chat/fetchMessages', async ({ communityId, channelId }) => {
  const data = await apiRequest(
    `/messages?communityId=${encodeURIComponent(communityId)}&channelId=${encodeURIComponent(channelId)}`
  );
  return asArray(data).map(toMessage);
});

/**
 * Optimistic send: pending adds the message at once (its temporary id is the
 * thunk's requestId), fulfilled swaps in the real id, rejected removes it.
 * sentAt is passed in so the reducer stays pure (no Date.now() inside it).
 */
export const sendChatMessage = createAsyncThunk(
  'chat/send',
  async ({ communityId, channelId, content, authorName }, { getState }) => {
    const userId = getState().auth.user?.id;
    const created = await apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({
        channelId: String(channelId),
        content,
        communityId: Number(communityId),
        authorId: userId ? Number(userId) : undefined,
        authorName,
      }),
    });
    return created?.id;
  }
);

// The backend toggles (second click removes your reaction) and returns the
// updated message, so the real counts are shown instead of guessing "+1".
export const toggleChatReaction = createAsyncThunk(
  'chat/toggleReaction',
  async ({ msgId, emoji, actorName }, { getState }) => {
    const userId = getState().auth.user?.id;
    const updated = await apiRequest(`/messages/${msgId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji, actorId: userId ? Number(userId) : undefined, actorName }),
    });
    return { msgId, reactions: toReactionList(updated?.reactions) };
  }
);

const initialState = {
  channels: DEFAULT_CHANNELS,
  channelsLoading: true,
  members: [],
  messages: [],
  messagesRequestId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // No community selected: nothing to load or show
    chatCleared: () => ({ ...initialState, channelsLoading: false }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatChannels.pending, (state) => {
        state.channelsLoading = true;
      })
      .addCase(fetchChatChannels.fulfilled, (state, action) => {
        state.channelsLoading = false;
        state.channels = action.payload.length > 0 ? action.payload : DEFAULT_CHANNELS;
      })
      .addCase(fetchChatChannels.rejected, (state) => {
        state.channelsLoading = false;
        state.channels = DEFAULT_CHANNELS;
      })
      .addCase(fetchChatMembers.fulfilled, (state, action) => {
        state.members = action.payload;
      })
      .addCase(fetchChatMembers.rejected, (state) => {
        state.members = [];
      })

      // Only the latest request may fill the feed: switching channels quickly
      // must not show a slower, earlier channel's messages.
      .addCase(fetchChatMessages.pending, (state, action) => {
        state.messagesRequestId = action.meta.requestId;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        if (action.meta.requestId === state.messagesRequestId) state.messages = action.payload;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        if (action.meta.requestId === state.messagesRequestId) state.messages = [];
      })

      .addCase(sendChatMessage.pending, (state, action) => {
        const { content, authorName, sentAt } = action.meta.arg;
        state.messages.push({
          id: action.meta.requestId,
          author: authorName,
          initials: authorName.slice(0, 2).toUpperCase(),
          color: '#34d399',
          text: content,
          time: timeOf(sentAt),
          reactions: [],
        });
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const msg = state.messages.find((m) => m.id === action.meta.requestId);
        if (msg && action.payload) msg.id = action.payload;
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.messages = state.messages.filter((m) => m.id !== action.meta.requestId);
      })

      .addCase(toggleChatReaction.fulfilled, (state, action) => {
        const msg = state.messages.find((m) => m.id === action.payload.msgId);
        if (msg) msg.reactions = action.payload.reactions;
      })

      .addCase(logout, () => initialState);
  },
});

export const { chatCleared } = chatSlice.actions;

export const selectChat = (state) => state.chat;

export default chatSlice.reducer;
