import { useState, useEffect } from 'react';
import { DEFAULT_STATS, DEFAULT_REVENUE } from '../../../Components/platform/data/ownerDashboardData';
import { dashboardService } from '../../../services/dashboardService';
import { authService } from '../../../services/authService';
import { apiRequest } from '../../../services/api';

function getCurrentUser() {
  const u = authService.getCurrentUser();
  return {
    id: u?.id,
    username: u?.username || 'owner',
    firstName: u?.firstName || 'Owner',
    lastName: u?.lastName || '',
    role: u?.role || 'owner',
  };
}


/**
 * Manages OwnerDashboard stats, revenue, and drill-down modal state.
 * Presentation components render drill-down tables; all data orchestration is handled here.
 */
export default function useOwnerDashboard() {
  const currentUser = getCurrentUser();

  const [stats, setStats] = useState(DEFAULT_STATS);
  const [revenue, setRevenue] = useState(DEFAULT_REVENUE);

  // Drilldown Modal
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('Details');
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillContent, setDrillContent] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await dashboardService.getStats();
        if (data) {
          setStats({
            totalCommunities: data.totalCommunities || 0,
            allCommunitiesCount: data.allCommunitiesCount ?? data.totalCommunities ?? 0,
            suspendedCommunitiesCount: data.suspendedCommunitiesCount || 0,
            totalEvents: data.totalEvents || 0,
            allEventsCount: data.allEventsCount ?? data.totalEvents ?? 0,
            suspendedEventsCount: data.suspendedEventsCount || 0,
            pendingReportsCount: data.pendingReportsCount || 0,
            pendingEventsCount: data.pendingEventsCount || 0,
            pendingAppealsCount: data.pendingAppealsCount || 0,
            backendStatus: 'Reachable',
          });
        }
      } catch {
        setStats((prev) => ({ ...prev, backendStatus: '⚠️ Unreachable' }));
      }

      try {
        const revData = await dashboardService.getRevenue();
        if (revData) {
          setRevenue({
            totalRevenue: revData.totalRevenue || 0,
            monthlyRevenue: revData.monthlyRevenue || 0,
            subscriptionRevenue: revData.subscriptionRevenue || 0,
            organiserRevenue: revData.organiserRevenue || 0,
            featuredEventRevenue: revData.featuredEventRevenue || 0,
            premiumUsers: revData.premiumUsers || 0,
            verifiedOrganisers: revData.verifiedOrganisers || 0,
            pendingOrganiserApplications: revData.pendingOrganiserApplications || 0,
          });
        }
      } catch {
        setStats((prev) => ({ ...prev, backendStatus: '⚠️ Unreachable' }));
      }
    }
    loadStats();
  }, []);

  const openDrill = async (kind, filter) => {
    setDrillModalOpen(true);
    setDrillLoading(true);
    const role = currentUser.role || 'owner';

    try {
      if (kind === 'communities') {
        setDrillTitle('Communities Breakdown');
        let communities = [];
        let users = [];
        let loadError = '';
        try {
          const [comms, usrs] = await Promise.all([
            apiRequest('/communities'),
            apiRequest('/users'),
          ]);
          communities = Array.isArray(comms) ? comms : [];
          users = Array.isArray(usrs) ? usrs : [];
        } catch (err) {
          communities = [];
          users = [];
          loadError = err.message || 'Failed to fetch communities from server.';
        }
        setDrillContent({ kind: 'communities', communities, users, loadError });
      } else if (kind === 'events') {
        setDrillTitle('Events Overview');
        let events = [];
        let communities = [];
        let loadError = '';
        try {
          const [evts, comms] = await Promise.all([
            apiRequest('/events?includeSuspended=true'),
            apiRequest('/communities'),
          ]);
          events = Array.isArray(evts) ? evts : [];
          communities = Array.isArray(comms) ? comms : [];
        } catch (err) {
          events = [];
          communities = [];
          loadError = err.message || 'Failed to fetch events from server.';
        }
        setDrillContent({ kind: 'events', events, communities, loadError });
      } else if (kind === 'revenue') {
        setDrillTitle('Revenue — All Transactions');
        let payments = [];
        let loadError = '';
        try {
          const res = await apiRequest('/payments/history');
          payments = Array.isArray(res) ? res : [];
        } catch (err) {
          payments = [];
          loadError = err.message || 'Failed to fetch payment history from server.';
        }
        setDrillContent({ kind: 'revenue', payments, loadError });
      } else if (kind === 'subscriptions') {
        setDrillTitle('Subscriptions Status');
        let subData = { byPlan: { free: 0, plus: 0, ultra_pro: 0 }, subscribers: [] };
        let loadError = '';
        try {
          subData = await apiRequest('/subscriptions');
        } catch (err) {
          loadError = err.message || 'Could not reach the backend.';
        }
        setDrillContent({ kind: 'subscriptions', subData, loadError });
      } else if (kind === 'organisers') {
        const title = filter === 'verified' ? 'Verified Organizers' : 'Pending Organizer Applications';
        setDrillTitle(title);
        let orgs = [];
        let loadError = '';
        try {
          const res = await apiRequest(`/organisers?status=${filter}`);
          orgs = Array.isArray(res) ? res : [];
        } catch (err) {
          orgs = [];
          loadError = err.message || 'Failed to fetch organizers from server.';
        }
        setDrillContent({ kind: 'organisers', orgs, filter, loadError });
      }
    } catch (err) {
      setDrillContent({ kind: 'error', message: err.message });
    }

    setDrillLoading(false);
  };

  return {
    currentUser,
    stats,
    revenue,
    drillModalOpen,
    setDrillModalOpen,
    drillTitle,
    drillLoading,
    drillContent,
    openDrill,
  };
}
