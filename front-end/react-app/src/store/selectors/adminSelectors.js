import { createSelector } from '@reduxjs/toolkit';
import { selectAdminUsers } from '../slices/adminUsersSlice';
import { selectAdminCommunities } from '../slices/adminCommunitiesSlice';
import {
  selectReports,
  selectEvents,
  selectAppeals,
  selectOrganizerApps,
  selectModeratorApps,
  selectTotalMessages,
} from '../slices/adminModerationSlice';

/**
 * Overview stat counts, derived from three admin slices.
 * createSelector caches the result, so the counts are only recomputed
 * when one of these lists actually changes.
 */
export const selectAdminStats = createSelector(
  [
    selectAdminUsers,
    selectAdminCommunities,
    selectReports,
    selectEvents,
    selectAppeals,
    selectOrganizerApps,
    selectModeratorApps,
    selectTotalMessages,
  ],
  (users, communities, reports, events, appeals, organizerApps, moderatorApps, totalMessages) => {
    const pendingApps =
      organizerApps.filter((a) => a.status === 'pending').length +
      moderatorApps.filter((a) => a.status === 'pending').length;
    return {
      users: users.length,
      comms: communities.length,
      escalatedReports: reports.filter((r) => r.status === 'escalated').length,
      events: events.filter((e) => e.status === 'approved').length,
      appeals: appeals.filter((a) => a.status === 'pending').length,
      // Pending applications; when none are pending, the total number of applications
      applications: pendingApps || organizerApps.length + moderatorApps.length,
      messages: totalMessages,
    };
  }
);
