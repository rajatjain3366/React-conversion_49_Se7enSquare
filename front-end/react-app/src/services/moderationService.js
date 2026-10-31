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
