export const DEFAULT_STATS = {
  totalCommunities: 0,
  allCommunitiesCount: 0,
  suspendedCommunitiesCount: 0,
  totalEvents: 0,
  allEventsCount: 0,
  suspendedEventsCount: 0,
  pendingReportsCount: 0,
  pendingEventsCount: 0,
  pendingAppealsCount: 0,
  backendStatus: 'Checking…',
};

export const DEFAULT_REVENUE = {
  totalRevenue: 0,
  monthlyRevenue: 0,
  subscriptionRevenue: 0,
  organiserRevenue: 0,
  featuredEventRevenue: 0,
  premiumUsers: 0,
  verifiedOrganisers: 0,
  pendingOrganiserApplications: 0,
};

// Metric card definitions for the revenue grid.
// `drillKind` and `drillFilter` are passed to openDrill().
export const REVENUE_CARDS = [
  { key: 'totalRevenue', icon: '💰', bg: 'bg-green', label: 'Total Revenue', drillKind: 'revenue', prefix: '₹' },
  { key: 'monthlyRevenue', icon: '📈', bg: 'bg-purple', label: 'Monthly Revenue', drillKind: 'revenue', prefix: '₹' },
  { key: 'organiserRevenue', icon: '🏆', bg: 'bg-orange', label: 'Organizer Revenue', drillKind: 'revenue', prefix: '₹' },
  { key: 'featuredEventRevenue', icon: '📣', bg: 'bg-green', label: 'Featured Event Revenue', drillKind: 'revenue', prefix: '₹' },
  { key: 'verifiedOrganisers', icon: '✅', bg: 'bg-cyan', label: 'Verified Organizers', drillKind: 'organisers', drillFilter: 'verified', prefix: '' },
  { key: 'pendingOrganiserApplications', icon: '⏳', bg: 'bg-orange', label: 'Pending Organizer Applications', drillKind: 'organisers', drillFilter: 'pending', prefix: '' },
];
