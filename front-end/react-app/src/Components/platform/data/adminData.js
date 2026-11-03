export const PAGES = [
  { id: 'overview',          icon: '⚡',  title: 'System Overview' },
  { id: 'users',             icon: '👥',  title: 'User Management' },
  { id: 'communities',       icon: '🏘️', title: 'Communities' },
  { id: 'escalated-reports', icon: '🛡️', title: 'Escalated Reports' },
  { id: 'events-mgmt',       icon: '📅',  title: 'Events' },
  { id: 'appeals',           icon: '⚖️',  title: 'Appeals' },
  { id: 'applications',      icon: '📋',  title: 'Applications' },
  { id: 'audit',             icon: '📜',  title: 'Audit Log' },
  // Configuration and Moderation tabs removed:
  // - Configuration: platformConfig has no frontend consumers beyond GET display; no real PATCH consumers.
  // - Moderation: replaced by "Escalated Reports" which shows only status=escalated rows.
];

export const DEFAULT_STATS = {
  users: 0,
  comms: 0,
  escalatedReports: 0,
  events: 0,
  appeals: 0,
  applications: 0,
  messages: 0,
};

export const DEFAULT_USERS = [];
export const DEFAULT_COMMUNITIES = [];
export const DEFAULT_ORGANIZER_APPS = [];
export const DEFAULT_MODERATOR_APPS = [];

export function getStatCards(stats) {
  return [
    { id: 'stat-users',    label: 'Total Users',        val: stats.users || 0,             icon: '👥', bg: 'bg-purple', page: 'users' },
    { id: 'stat-comms',    label: 'Communities',        val: stats.comms || 0,             icon: '🏘️', bg: 'bg-cyan',   page: 'communities' },
    { id: 'stat-reports',  label: 'Escalated Reports',  val: stats.escalatedReports || 0,  icon: '🛡️', bg: 'bg-orange', page: 'escalated-reports' },
    { id: 'stat-events',   label: 'Active Events',      val: stats.events || 0,            icon: '📅', bg: 'bg-green',  page: 'events-mgmt' },
    { id: 'stat-appeals',  label: 'Open Appeals',       val: stats.appeals || 0,           icon: '⚖️', bg: 'bg-purple', page: 'appeals' },
    { id: 'stat-apps',     label: 'Applications',       val: stats.applications ?? stats.messages ?? 0, icon: '📋', bg: 'bg-cyan', page: 'applications' },
  ];
}
