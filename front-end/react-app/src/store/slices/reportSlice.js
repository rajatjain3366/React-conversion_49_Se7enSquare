import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { logout } from './authSlice';

/**
 * Report slice: the 4-step report wizard.
 * Living in the store means a half-filled report survives leaving the page and coming back.
 */

// GET /users?search= -> first 6 matches
export const searchUsers = createAsyncThunk('report/searchUsers', async (query) => {
  const data = await apiRequest(`/users?search=${encodeURIComponent(query)}`);
  return Array.isArray(data) ? data.slice(0, 6) : [];
});

// POST /reports. Reads the wizard fields and the reporter from the store with getState().
export const submitReport = createAsyncThunk('report/submitReport', async (_, { getState }) => {
  const { report, auth } = getState();
  const { selectedReason, additionalContext, selectedTarget } = report;

  // Backend CreateReportDto: reason 8-200 chars, ids are positive integers
  const reasonText = (selectedReason + (additionalContext ? `: ${additionalContext}` : '')).slice(0, 195);
  const reportData = {
    reporterId: Number(auth.user?.id),
    targetType: selectedTarget?.type === 'post' ? 'post' : 'user',
    targetId: Number(selectedTarget?.id),
    reason: reasonText.length >= 8 ? reasonText : `${reasonText} - reported by user`,
  };

  const data = await apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  });
  return `RPT-${data.id}`;
});

const initialState = {
  step: 1,
  selectedTarget: null,
  selectedReason: '',
  additionalContext: '',
  confirmed: false,
  submitting: false,
  submitted: false,
  refId: '',
  userSearch: '',
  searchResults: [],
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    // A link like /report?user=7 starts a fresh report for that target
    reportStarted(state, action) {
      return { ...initialState, selectedTarget: action.payload };
    },
    reportReset() {
      return initialState;
    },
    stepChanged(state, action) {
      state.step = action.payload;
    },
    targetSelected(state, action) {
      state.selectedTarget = action.payload;
    },
    reasonSelected(state, action) {
      state.selectedReason = action.payload;
    },
    contextChanged(state, action) {
      state.additionalContext = action.payload;
    },
    confirmedChanged(state, action) {
      state.confirmed = action.payload;
    },
    userSearchChanged(state, action) {
      state.userSearch = action.payload;
      if (!action.payload.trim()) state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchUsers.fulfilled, (state, action) => {
        // Ignore an older, slower response: only results for the current text count
        if (action.meta.arg === state.userSearch) {
          state.searchResults = action.payload;
        }
      })
      .addCase(searchUsers.rejected, (state, action) => {
        if (action.meta.arg === state.userSearch) {
          state.searchResults = [];
        }
      })
      .addCase(submitReport.pending, (state) => {
        state.submitting = true;
      })
      .addCase(submitReport.fulfilled, (state, action) => {
        // The success step only appears once the backend has saved the report
        state.submitting = false;
        state.refId = action.payload;
        state.step = 4;
        state.submitted = true;
      })
      .addCase(submitReport.rejected, (state) => {
        state.submitting = false;
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  reportStarted,
  reportReset,
  stepChanged,
  targetSelected,
  reasonSelected,
  contextChanged,
  confirmedChanged,
  userSearchChanged,
} = reportSlice.actions;

export const selectReport = (state) => state.report;

export default reportSlice.reducer;
