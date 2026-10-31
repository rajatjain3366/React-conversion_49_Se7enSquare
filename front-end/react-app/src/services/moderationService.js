/**
 * Moderation Service Module
 * Handles loading reports, updating report status, and report management.
 */
import { apiRequest } from './api';

export const moderationService = {
  async getReports() {
    return await apiRequest('/reports');
  },

  async createReport(payload) {
    return await apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // resolutionNote is optional; JSON.stringify drops it when undefined.
  async updateReportStatus(reportId, status, resolutionNote) {
    return await apiRequest(`/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolutionNote }),
    });
  },

  // GET /users/:id: the public identity (id, username, role) is always
  // returned, even for private profiles. Used to show reported usernames.
  async getUser(userId) {
    return await apiRequest(`/users/${userId}`);
  },

  // GET /communities/:id: used to show the community's name on community reports.
  async getCommunity(communityId) {
    return await apiRequest(`/communities/${communityId}`);
  },

  // POST /sanctions (moderator or admin). Stores the sanction and notifies
  // the user. It does NOT change the account status (only admin ban/suspend does).
  async createSanction(payload) {
    return await apiRequest('/sanctions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteReport(reportId) {
    return await apiRequest(`/reports/${reportId}`, {
      method: 'DELETE',
    });
  },
};
