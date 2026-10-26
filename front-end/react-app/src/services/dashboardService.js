/**
 * Dashboard Service Module
 * Handles loading communities, events, notifications, overview statistics, and revenue metrics.
 */
import { apiRequest } from './api';

export const dashboardService = {
  /**
   * Returns communities the current user has joined, enriched with full community data.
   * Falls back to the full community list if the memberships endpoint fails.
   */
  async getJoinedCommunities(userId) {
    if (!userId) return [];
    try {
      const memberships = await apiRequest(`/memberships?userId=${encodeURIComponent(userId)}`);
      if (!Array.isArray(memberships) || memberships.length === 0) return [];
      // Enrich membership records with full community details
      const communities = await Promise.allSettled(
        memberships.map((m) => apiRequest(`/communities/${m.communityId}`))
      );
      return communities
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value);
    } catch {
      return [];
    }
  },

  /**
   * Returns communities created (owned) by the current user.
   */
  async getCreatedCommunities(userId) {
    if (!userId) return [];
    try {
      const all = await apiRequest('/communities');
      return Array.isArray(all)
        ? all.filter((c) => String(c.ownerId) === String(userId))
        : [];
    } catch {
      return [];
    }
  },

  async getEvents() {
    return await apiRequest('/events');
  },

  async getNotifications(userId) {
    if (!userId) return [];
    return await apiRequest(`/notifications?userId=${encodeURIComponent(userId)}`);
  },

  async getStats() {
    return await apiRequest('/dashboard/stats');
  },

  async getLandingStats() {
    return await apiRequest('/dashboard/landing-stats');
  },

  async getRevenue() {
    return await apiRequest('/dashboard/revenue');
  },
};
