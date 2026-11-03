/**
 * Dashboard Service Module
 * Platform statistics and revenue metrics (Owner Dashboard, Landing page).
 * The user Dashboard's communities, events and notifications come from Redux slices.
 */
import { apiRequest } from './api';

export const dashboardService = {
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
