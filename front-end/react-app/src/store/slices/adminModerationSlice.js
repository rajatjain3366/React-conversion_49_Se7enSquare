import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { appealService } from '../../services/appealService';
import { logout } from './authSlice';
import { addAuditEntry } from './auditLogSlice';
import { fetchUsers } from './adminUsersSlice';

/**
 * Admin moderation slice: escalated reports, events, appeals, organizer/moderator
 * applications and the platform message count.
 * Every action calls the backend first, then re-fetches the affected list.
 */

const asArray = (data) => (Array.isArray(data) ? data : []);

export const fetchReports = createAsyncThunk('adminModeration/fetchReports', async () =>
  asArray(await apiRequest('/reports'))
);

export const fetchEvents = createAsyncThunk('adminModeration/fetchEvents', async () =>
  asArray(await apiRequest('/events'))
);

export const fetchAppeals = createAsyncThunk('adminModeration/fetchAppeals', async () =>
  asArray(await apiRequest('/appeals'))
);

export const fetchDashboardStats = createAsyncThunk('adminModeration/fetchStats', async () => {
  const s = await apiRequest('/dashboard/stats');
  return s?.totalMessages ?? 0;
});

// Both application queues plus /users to show usernames instead of ids, fetched in parallel
export const fetchApplications = createAsyncThunk('adminModeration/fetchApplications', async () => {
  const [orgRes, modRes, usersRes] = await Promise.all([
    apiRequest('/organisers'),
    apiRequest('/moderator-certification'),
    apiRequest('/users'),
  ]);
  const userMap = new Map(asArray(usersRes).map((u) => [u.id, u]));
  const nameOf = (userId) => userMap.get(userId)?.username || `User #${userId}`;
  const dateOf = (d) => (d ? new Date(d).toLocaleDateString() : 'Recently');

  return {
    organizerApps: asArray(orgRes).map((o) => ({
      id: o.id,
      user: nameOf(o.userId),
      experience: o.experienceNote || 'Experience note on file',
      applied: dateOf(o.appliedAt),
      status: o.status || 'pending',
    })),
    moderatorApps: asArray(modRes).map((m) => ({
      id: m.id,
      user: nameOf(m.userId),
      quizScore: `${m.quizScore ?? 0}%`,
      applied: dateOf(m.appliedAt),
      status: m.status || 'pending',
    })),
  };
});

const resolveReport = (reportId, resolutionNote) =>
  apiRequest(`/reports/${reportId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'resolved', resolutionNote }),
  });

const sanction = (report, type, reason) =>
  apiRequest('/sanctions', {
    method: 'POST',
    body: JSON.stringify({
      targetUserId: report.targetId,
      communityId: report.communityId || null,
      type,
      reason,
      reportId: report.id,
    }),
  });

/**
 * The 5 actions on an escalated report. `report` is the enriched report from
 * EscalatedReportsTab (it carries the target user object).
 */
export const resolveEscalatedReport = createAsyncThunk(
  'adminModeration/resolveEscalatedReport',
  async ({ report, actionType, note }, { dispatch }) => {
    const resolutionNote = (note || '').trim();
    const target = report.target?.username
      ? `@${report.target.username} · report #${report.id}`
      : `report #${report.id}`;
    let auditAction;
    let reason = resolutionNote;

    if (actionType === 'dismiss') {
      await resolveReport(report.id, resolutionNote);
      auditAction = 'Report Dismissed';
    } else if (actionType === 'warn') {
      reason = resolutionNote || 'Official warning following escalated report';
      await sanction(report, 'warn', reason);
      await resolveReport(report.id, reason);
      auditAction = 'Warning Issued';
    } else if (actionType === 'remove_content') {
      reason = resolutionNote || 'Content removed following escalated report';
      await sanction(report, 'content_removed', reason);
      await resolveReport(report.id, reason);
      auditAction = 'Content Removed';
    } else if (actionType === 'suspend_author') {
      reason = resolutionNote || 'Author suspended following escalated report';
      await apiRequest(`/users/${report.targetId}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) });
      await resolveReport(report.id, reason);
      auditAction = 'Author Suspended';
    } else if (actionType === 'ban_author') {
      reason = resolutionNote || 'Author permanently banned following escalated report';
      await apiRequest(`/users/${report.targetId}/ban`, { method: 'POST', body: JSON.stringify({ reason }) });
      await resolveReport(report.id, reason);
      auditAction = 'Author Banned';
    }

    dispatch(addAuditEntry({ action: auditAction, target, reason }));
    // A suspended or banned author changes the Users tab too: refresh that slice as well
    if (actionType === 'suspend_author' || actionType === 'ban_author') {
      dispatch(fetchUsers());
    }
    await dispatch(fetchReports());
    return actionType;
  }
);

export const reviewAppeal = createAsyncThunk(
  'adminModeration/reviewAppeal',
  async ({ appealId, status }, { dispatch }) => {
    await appealService.reviewAppeal(appealId, status);
    dispatch(addAuditEntry({
      action: status === 'approved' ? 'Appeal Approved' : 'Appeal Rejected',
      target: `appeal #${appealId}`,
    }));
    await dispatch(fetchAppeals());
  }
);

// status is the backend value: 'verified' or 'rejected'
export const reviewOrganizerApp = createAsyncThunk(
  'adminModeration/reviewOrganizerApp',
  async ({ id, status, rejectionReason }, { getState, dispatch }) => {
    const applicant = getState().adminModeration.organizerApps.find((a) => a.id === id)?.user;
    await apiRequest(`/organisers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
    dispatch(addAuditEntry({
      action: status === 'verified' ? 'Organizer Application Approved' : 'Organizer Application Rejected',
      target: applicant ? `@${applicant}` : `application #${id}`,
      reason: rejectionReason,
    }));
    await dispatch(fetchApplications());
  }
);

// status is the backend value: 'certified' or 'rejected'
export const reviewModeratorApp = createAsyncThunk(
  'adminModeration/reviewModeratorApp',
  async ({ id, status, rejectionReason }, { getState, dispatch }) => {
    const applicant = getState().adminModeration.moderatorApps.find((a) => a.id === id)?.user;
    await apiRequest(`/moderator-certification/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
    dispatch(addAuditEntry({
      action: status === 'certified' ? 'Moderator Application Approved' : 'Moderator Application Rejected',
      target: applicant ? `@${applicant}` : `application #${id}`,
      reason: rejectionReason,
    }));
    await dispatch(fetchApplications());
  }
);

const initialState = {
  reports: [],
  events: [],
  appeals: [],
  organizerApps: [],
  moderatorApps: [],
  totalMessages: 0,
};

const adminModerationSlice = createSlice({
  name: 'adminModeration',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reports = action.payload;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.events = action.payload;
      })
      .addCase(fetchAppeals.fulfilled, (state, action) => {
        state.appeals = action.payload;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.organizerApps = action.payload.organizerApps;
        state.moderatorApps = action.payload.moderatorApps;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.totalMessages = action.payload;
      })
      .addCase(logout, () => initialState);
  },
});

export const selectReports = (state) => state.adminModeration.reports;
export const selectEvents = (state) => state.adminModeration.events;
export const selectAppeals = (state) => state.adminModeration.appeals;
export const selectOrganizerApps = (state) => state.adminModeration.organizerApps;
export const selectModeratorApps = (state) => state.adminModeration.moderatorApps;
export const selectTotalMessages = (state) => state.adminModeration.totalMessages;

export default adminModerationSlice.reducer;
