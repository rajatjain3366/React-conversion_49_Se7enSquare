import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { moderationService } from '../../services/moderationService';
import { QUEUE_TABS } from '../../Components/platform/data/modPanelData';
import { logout } from './authSlice';

/**
 * Moderator Panel slice: the report queue and the moderator's actions on it.
 * Backend rule for report status: pending -> reviewed -> resolved (no skipping),
 * escalation is allowed from pending or reviewed.
 * The queue tab, search box, selected report and note box are page-only UI and stay in the hook.
 */

// Reports only store targetType/targetId. Look each user/community up once so the
// queue shows "@player01" or "Community: Valorant India" instead of a bare ID.
// A failed lookup (deleted user/community) just falls back to the ID.
async function lookupNames(ids, fetchOne, field) {
  const names = {};
  await Promise.all([...new Set(ids)].map(async (id) => {
    try {
      const item = await fetchOne(id);
      if (item?.[field]) names[id] = item[field];
    } catch { /* keep the ID */ }
  }));
  return names;
}

export const fetchModReports = createAsyncThunk('modPanel/fetchReports', async () => {
  const data = await moderationService.getReports();
  if (!Array.isArray(data)) return [];

  const idsOf = (type) => data.filter((r) => r.targetType === type).map((r) => r.targetId);
  const [usernames, communityNames] = await Promise.all([
    lookupNames(idsOf('user'), moderationService.getUser, 'username'),
    lookupNames(idsOf('community'), moderationService.getCommunity, 'name'),
  ]);

  // A post/community targetId is NOT a user ID, so it must not be shown as "@4"
  const targetLabel = (r) => {
    if (r.targetType === 'post') return `Post #${r.targetId}`;
    if (r.targetType === 'community') return `Community: ${communityNames[r.targetId] || `#${r.targetId}`}`;
    return `@${usernames[r.targetId] || r.reportedUser?.username || r.targetId || 'Unknown'}`;
  };

  return data.map((r) => ({
    id: r.id,
    ref: r.ref || `RPT-${r.id}`,
    type: r.targetType || 'message',
    targetId: r.targetId, // needed to sanction the reported user
    // Display label, always a string (the queue search calls .toLowerCase())
    reportedUser: targetLabel(r),
    channel: r.channel || '#general',
    reason: r.reason || 'Violation',
    status: r.status || 'pending',
    date: r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
    context: r.context || '',
    severity: r.severity || 'medium',
    action: r.action,
  }));
});

/**
 * Steps: 1) pending -> reviewed, 2) create the sanction, 3) reviewed -> resolved.
 * `reached` remembers how far we got. If a later step fails, the rejected action
 * still carries `reached`, so the queue shows the real backend status (no fake success).
 */
export const takeModAction = createAsyncThunk(
  'modPanel/takeAction',
  async ({ modAction, report, note }, { rejectWithValue }) => {
    const actionText = `${modAction.label}${note ? ` — ${note}` : ''}`;
    let reached = report.status;
    try {
      if (reached === 'pending') {
        await moderationService.updateReportStatus(report.id, 'reviewed');
        reached = 'reviewed';
      }
      if (modAction.sanction) {
        await moderationService.createSanction({
          targetUserId: Number(report.targetId),
          type: modAction.sanction,
          reason: actionText,
          reportId: report.id,
          ...(modAction.hours
            ? { expiresAt: new Date(Date.now() + modAction.hours * 3600 * 1000).toISOString() }
            : {}),
        });
      }
      await moderationService.updateReportStatus(report.id, 'resolved', actionText);
      return { id: report.id, status: 'resolved', action: actionText };
    } catch (err) {
      return rejectWithValue({ id: report.id, status: reached, message: err.message });
    }
  },
  {
    // Reports keep only targetType/targetId, so only a user report can be sanctioned.
    // Returning false skips the thunk entirely: no request, no pending action.
    condition: ({ modAction, report }) => !(modAction.sanction && report.type !== 'user'),
  }
);

export const escalateReport = createAsyncThunk('modPanel/escalate', async ({ report, note }) => {
  await moderationService.updateReportStatus(report.id, 'escalated', note || undefined);
  return { id: report.id, status: 'escalated' };
});

export const moveToReview = createAsyncThunk('modPanel/moveToReview', async (reportId) => {
  await moderationService.updateReportStatus(reportId, 'reviewed');
  return { id: reportId, status: 'reviewed' };
});

const initialState = {
  reports: [],
  loading: true,
  processing: false,
};

// Apply { id, status, action? } to one report in the queue
function patchReport(state, { id, status, action }) {
  const report = state.reports.find((r) => r.id === id);
  if (!report) return;
  report.status = status;
  if (action) report.action = action;
}

const modPanelSlice = createSlice({
  name: 'modPanel',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchModReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchModReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchModReports.rejected, (state) => {
        state.loading = false;
        state.reports = [];
      })

      .addCase(takeModAction.pending, (state) => {
        state.processing = true;
      })
      .addCase(takeModAction.fulfilled, (state, action) => {
        state.processing = false;
        patchReport(state, action.payload);
      })
      .addCase(takeModAction.rejected, (state, action) => {
        state.processing = false;
        // Partial progress: the report may already be "reviewed" on the server
        if (action.payload) patchReport(state, action.payload);
      })

      .addCase(escalateReport.pending, (state) => {
        state.processing = true;
      })
      .addCase(escalateReport.fulfilled, (state, action) => {
        state.processing = false;
        patchReport(state, action.payload);
      })
      .addCase(escalateReport.rejected, (state) => {
        state.processing = false;
      })

      .addCase(moveToReview.fulfilled, (state, action) => {
        patchReport(state, action.payload);
      })

      .addCase(logout, () => initialState);
  },
});

export const selectModReports = (state) => state.modPanel.reports;
export const selectModReportsLoading = (state) => state.modPanel.loading;
export const selectModProcessing = (state) => state.modPanel.processing;

// Number of reports in each queue tab
export const selectQueueCounts = createSelector([selectModReports], (reports) =>
  QUEUE_TABS.reduce((acc, status) => {
    acc[status] = reports.filter((r) => r.status === status).length;
    return acc;
  }, {})
);

export const selectRecentModActions = createSelector([selectModReports], (reports) =>
  reports.filter((r) => r.status === 'resolved' && r.action).slice(0, 3)
);

export default modPanelSlice.reducer;
