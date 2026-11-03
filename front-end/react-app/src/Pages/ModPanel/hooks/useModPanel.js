import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toastShown } from '../../../store/slices/uiSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  fetchModReports,
  takeModAction,
  escalateReport as escalateReportThunk,
  moveToReview as moveToReviewThunk,
  selectModReports,
  selectModReportsLoading,
  selectModProcessing,
  selectQueueCounts,
  selectRecentModActions,
} from '../../../store/slices/modPanelSlice';
import { QUEUE_TABS, MOD_ACTIONS } from '../../../Components/platform/data/modPanelData';

/**
 * Connects ModPanel to the Redux modPanel slice.
 * Reports and their statuses live in the store; the queue tab, search box,
 * selected report and note box are page-only UI state.
 */
export default function useModPanel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sessionUser = useSelector(selectCurrentUser);
  const user = {
    role: sessionUser?.role || 'moderator',
    firstName: sessionUser?.firstName || sessionUser?.username || 'Moderator',
    username: sessionUser?.username || 'moderator',
  };

  const reports = useSelector(selectModReports);
  const loading = useSelector(selectModReportsLoading);
  const processing = useSelector(selectModProcessing);
  const queueCounts = useSelector(selectQueueCounts);
  const recentActions = useSelector(selectRecentModActions);

  const [activeQTab, setActiveQTab] = useState('pending');
  const [selectedId, setSelectedId] = useState(null);
  const [queueSearch, setQueueSearch] = useState('');
  const [actionNote, setActionNote] = useState('');

  const showToast = (msg) => dispatch(toastShown({ msg }));

  useEffect(() => {
    dispatch(fetchModReports());
  }, [dispatch, user.role]);

  // Only the id is kept locally, so the detail view always shows the store's
  // latest copy of the report. Falls back to the first report.
  const selectedReport = reports.find((r) => r.id === selectedId) || reports[0] || null;
  const setSelectedReport = (report) => setSelectedId(report?.id ?? null);

  const filteredReports = reports.filter(
    (r) =>
      r.status === activeQTab &&
      (!queueSearch ||
        r.reportedUser?.toLowerCase().includes(queueSearch.toLowerCase()) ||
        r.ref?.toLowerCase().includes(queueSearch.toLowerCase()) ||
        r.reason?.toLowerCase().includes(queueSearch.toLowerCase()))
  );

  const takeAction = async (modAction, report) => {
    const result = await dispatch(takeModAction({ modAction, report, note: actionNote.trim() }));
    if (result.meta.condition) {
      // The thunk's condition skipped it: sanctions need a user report
      showToast('⚠️ Sanctions need a user report. Dismiss or escalate this one.');
    } else if (takeModAction.fulfilled.match(result)) {
      setActionNote('');
      showToast(`✅ Action taken: ${modAction.label}`);
    } else {
      showToast(`❌ ${result.payload?.message || result.error.message}`);
    }
  };

  // Escalated reports appear in the admin dashboard's "Escalated Reports" tab
  const escalateReport = async (report) => {
    try {
      await dispatch(escalateReportThunk({ report, note: actionNote.trim() })).unwrap();
      setActionNote('');
      showToast('⬆️ Escalated to admin');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const moveToReview = async (reportId) => {
    try {
      await dispatch(moveToReviewThunk(reportId)).unwrap();
      showToast('📋 Moved to In Review');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  return {
    navigate,
    user,
    // Reports
    reports,
    loading,
    filteredReports,
    selectedReport,
    setSelectedReport,
    // Queue
    activeQTab,
    setActiveQTab,
    queueSearch,
    setQueueSearch,
    queueCounts,
    // Actions
    actionNote,
    setActionNote,
    takeAction,
    escalateReport,
    moveToReview,
    processing,
    // Derived
    recentActions,
    MOD_ACTIONS,
    QUEUE_TABS,
  };
}
