/** Static data constants for the Moderator Panel page. */

export const DEFAULT_REPORTS = [];

// Tab values must equal the backend report statuses ('reviewed', not 'review'),
// because the queue filters with r.status === tab.
export const QUEUE_TABS = ['pending', 'reviewed', 'escalated', 'resolved'];

// sanction = the SanctionType sent to POST /sanctions (null = no sanction).
// hours = how long it lasts; becomes expiresAt (null = permanent).
export const MOD_ACTIONS = [
  { label: '⚠️ Warn User',         action: 'warn',       sanction: 'warn',            hours: null },
  { label: '🔇 Mute (24h)',         action: 'mute_24h',   sanction: 'mute',            hours: 24 },
  { label: '🔇 Mute (7d)',          action: 'mute_7d',    sanction: 'mute',            hours: 24 * 7 },
  { label: '🚫 Temp Ban (3d)',      action: 'ban_3d',     sanction: 'ban',             hours: 24 * 3 },
  { label: '🚫 Temp Ban (7d)',      action: 'ban_7d',     sanction: 'ban',             hours: 24 * 7 },
  { label: '⛔ Permanent Ban',      action: 'ban_perm',   sanction: 'ban',             hours: null },
  { label: '🗑️ Delete Message',    action: 'delete_msg', sanction: 'content_removed', hours: null },
  { label: '✅ Dismiss',            action: 'dismiss',    sanction: null,              hours: null },
];
