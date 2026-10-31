import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest, getStoredUser } from '../../../services/api';

/**
 * Custom hook managing the 4-step report state, search params, API submissions, and form resets.
 */
export default function useReportForm() {
  const [currentUser] = useState(() => {
    try {
      const u = getStoredUser() || {};
      return {
        firstName: u.firstName || u.name?.split(' ')[0] || u.username || 'User',
      };
    } catch {
      return { firstName: 'User' };
    }
  });

  const [searchParams] = useSearchParams();
  const user = getStoredUser() || { id: 4, role: 'user' };

  const ctxUser = searchParams.get('user');
  const ctxUserName = searchParams.get('uname') ? decodeURIComponent(searchParams.get('uname')) : null;
  const ctxMsg = searchParams.get('msg');
  const ctxMsgText = searchParams.get('text') ? decodeURIComponent(searchParams.get('text')) : null;

  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');

  // Target selection state
  const [selectedTarget, setSelectedTarget] = useState(() => {
    if (ctxUser) return { type: 'user', id: ctxUser, name: ctxUserName || `User #${ctxUser}` };
    if (ctxMsg) return { type: 'message', id: ctxMsg, text: ctxMsgText, author: ctxUserName || null };
    return null;
  });

  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const handleUserSearch = async (val) => {
    setUserSearch(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await apiRequest(`/users?search=${encodeURIComponent(val)}`);
      setSearchResults(Array.isArray(data) ? data.slice(0, 6) : []);
    } catch {
      setSearchResults([]);
    }
  };

  const submitReport = async () => {
    if (!selectedReason || !confirmed) return;
    setSubmitting(true);
    const reasonText = (selectedReason + (additionalContext ? `: ${additionalContext}` : '')).slice(0, 195);
    const reportData = {
      reporterId: Number(user.id || 4),
      targetType: selectedTarget?.type === 'post' ? 'post' : 'user',
      targetId: Number(selectedTarget?.id || 1),
      reason: reasonText.length >= 8 ? reasonText : `${reasonText} - reported by user`,
    };
    // Only show the success step (with the real report ID) when the backend
    // actually saved the report. Before, a failed request still showed a
    // made-up "RPT-<timestamp>" reference, so users thought it was sent.
    try {
      const data = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
      setRefId(`RPT-${data.id}`);
      setStep(4);
      setSubmitted(true);
    } catch (err) {
      showToast(`❌ Report not sent: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedReason('');
    setAdditionalContext('');
    setConfirmed(false);
    setSubmitted(false);
    setRefId('');
    setSelectedTarget(null);
    setUserSearch('');
    setSearchResults([]);
  };

  const goStep = (s) => {
    if (s === 2 && !selectedTarget) {
      showToast('⚠️ Please select a user to report first.');
      return;
    }
    if (s === 3 && !selectedReason) {
      showToast('⚠️ Please select a reason.');
      return;
    }
    setStep(s);
  };

  return {
    currentUser,
    step,
    setStep,
    selectedReason,
    setSelectedReason,
    additionalContext,
    setAdditionalContext,
    confirmed,
    setConfirmed,
    submitted,
    refId,
    userSearch,
    selectedTarget,
    setSelectedTarget,
    searchResults,
    toast,
    submitting,
    handleUserSearch,
    submitReport,
    resetForm,
    goStep,
  };
}
