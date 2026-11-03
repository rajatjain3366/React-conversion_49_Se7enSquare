import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toastShown } from '../../../store/slices/uiSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  searchUsers,
  submitReport as submitReportThunk,
  reportStarted,
  reportReset,
  stepChanged,
  targetSelected,
  reasonSelected,
  contextChanged,
  confirmedChanged,
  userSearchChanged,
  selectReport,
} from '../../../store/slices/reportSlice';

/**
 * Custom hook connecting the 4-step Report page to the Redux report slice.
 * Returns the same values as before, so the step components are unchanged.
 */
export default function useReportForm() {
  const dispatch = useDispatch();
  const sessionUser = useSelector(selectCurrentUser);
  const report = useSelector(selectReport);
  const [searchParams] = useSearchParams();

  const currentUser = {
    firstName: sessionUser?.firstName || sessionUser?.name?.split(' ')[0] || sessionUser?.username || 'User',
  };

  const showToast = (msg) => dispatch(toastShown({ msg }));

  // Links from other pages pre-fill the target: /report?user=7&uname=... or /report?msg=55&text=...
  const ctxUser = searchParams.get('user');
  const ctxMsg = searchParams.get('msg');
  const ctxUserName = searchParams.get('uname');
  const ctxMsgText = searchParams.get('text');

  useEffect(() => {
    if (ctxUser) {
      dispatch(reportStarted({ type: 'user', id: ctxUser, name: ctxUserName || `User #${ctxUser}` }));
    } else if (ctxMsg) {
      dispatch(reportStarted({ type: 'message', id: ctxMsg, text: ctxMsgText, author: ctxUserName || null }));
    }
  }, [dispatch, ctxUser, ctxMsg, ctxUserName, ctxMsgText]);

  // A finished report should not greet the user again next time they open the page
  useEffect(() => () => {
    if (report.submitted) dispatch(reportReset());
  }, [dispatch, report.submitted]);

  const handleUserSearch = (val) => {
    dispatch(userSearchChanged(val));
    if (val.trim()) dispatch(searchUsers(val));
  };

  const submitReport = async () => {
    if (!report.selectedReason || !report.confirmed || !report.selectedTarget) return;
    try {
      await dispatch(submitReportThunk()).unwrap();
    } catch (err) {
      showToast(`❌ Report not sent: ${err.message}`);
    }
  };

  const goStep = (s) => {
    if (s === 2 && !report.selectedTarget) {
      showToast('⚠️ Please select a user to report first.');
      return;
    }
    if (s === 3 && !report.selectedReason) {
      showToast('⚠️ Please select a reason.');
      return;
    }
    dispatch(stepChanged(s));
  };

  return {
    currentUser,
    step: report.step,
    setStep: (s) => dispatch(stepChanged(s)),
    selectedReason: report.selectedReason,
    setSelectedReason: (r) => dispatch(reasonSelected(r)),
    additionalContext: report.additionalContext,
    setAdditionalContext: (text) => dispatch(contextChanged(text)),
    confirmed: report.confirmed,
    setConfirmed: (value) => dispatch(confirmedChanged(value)),
    submitted: report.submitted,
    refId: report.refId,
    userSearch: report.userSearch,
    selectedTarget: report.selectedTarget,
    setSelectedTarget: (target) => dispatch(targetSelected(target)),
    searchResults: report.searchResults,
    submitting: report.submitting,
    handleUserSearch,
    submitReport,
    resetForm: () => dispatch(reportReset()),
    goStep,
  };
}
