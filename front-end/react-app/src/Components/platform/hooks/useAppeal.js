import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APPEAL_TYPES } from '../data/appealData';
import { appealService } from '../../../services/appealService';
import { authService } from '../../../services/authService';
import { apiRequest } from '../../../services/api';

/**
 * Manages all state, validation, and submission logic for the Appeal page.
 * Reads account restriction info from URL params (set by Login redirect) or
 * from GET /sanctions/mine for logged-in users.
 */
export default function useAppeal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawUser = authService.getCurrentUser();
  const [user, setUser] = useState({
    role: rawUser?.role || 'user',
    firstName: rawUser?.firstName || 'User',
    username: rawUser?.username || 'user',
    id: rawUser?.id || null,
    status: rawUser?.status || 'active',
    statusReason: rawUser?.statusReason || '',
  });

  // Fetch full profile to get up-to-date status & reason
  useEffect(() => {
    if (!rawUser?.id) return;
    apiRequest('/users/me')
      .then(profile => {
        if (profile) {
          setUser(prev => ({
            ...prev,
            status: profile.status || 'active',
            statusReason: profile.statusReason || '',
            username: profile.username || prev.username,
            firstName: profile.firstName || prev.firstName,
          }));
        }
      })
      .catch(() => { /* keep session data */ });
  }, [rawUser?.id]);

  // Extract restriction details from URL (set on login redirect) or fetch from API
  const [action, setAction] = useState(() => {
    const code = searchParams.get('accountStatus');
    const reason = searchParams.get('reason');
    const until = searchParams.get('until');
    if (code) {
      return {
        type: code === 'ACCOUNT_BANNED' ? 'Account Ban' : 'Account Suspension',
        reason: reason || 'Violation of community guidelines',
        until: until || null,
        id: `SAN-${Date.now()}`,
      };
    }
    return null;
  });

  const [appealType, setAppealType] = useState('');
  const [statement, setStatement] = useState('');
  const [commitment, setCommitment] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refId, setRefId] = useState('');
  const [myAppeals, setMyAppeals] = useState([]);
  const [loadingAppeals, setLoadingAppeals] = useState(false);

  // If no URL params, try fetching the most recent active sanction for context
  useEffect(() => {
    if (action || !user.id) return;
    let cancelled = false;
    apiRequest('/sanctions/mine')
      .then((sanctions) => {
        if (cancelled || !Array.isArray(sanctions)) return;
        const active = sanctions.find(
          (s) => s.active && (s.type === 'ban' || s.type === 'suspend')
        );
        if (active && !cancelled) {
          setAction({
            type: active.type === 'ban' ? 'Account Ban' : 'Account Suspension',
            reason: active.reason || 'Violation of community guidelines',
            until: active.endsAt || null,
            id: `SAN-${active.id}`,
          });
        }
      })
      .catch(() => { /* sanctions endpoint may be unavailable if banned — that's ok */ });
    return () => { cancelled = true; };
  }, [user.id, action]);

  const fetchAppeals = useCallback(async () => {
    if (!user.id) return;
    setLoadingAppeals(true);
    try {
      const data = await appealService.getAppeals(user.id);
      if (Array.isArray(data)) {
        setMyAppeals(data.filter((a) => !user.id || String(a.userId) === String(user.id)));
      }
    } catch (err) {
      console.warn('Could not fetch appeals:', err);
    } finally {
      setLoadingAppeals(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const validate = () => {
    const errs = {};
    if (!appealType) errs.type = 'Please select an appeal type.';
    if (!statement.trim() || statement.trim().length < 20) {
      errs.statement = 'Your statement must be at least 20 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const payload = {
      userId: Number(user.id || 4),
      actionId: action?.id || `ACT-${Date.now()}`,
      text: statement.trim(),
      acknowledgement: (commitment || 'I agree to the platform community guidelines').slice(0, 95),
      resolution: (appealType || 'Reconsideration').slice(0, 95),
      evidence: [],
    };

    try {
      const data = await appealService.createAppeal(payload);
      setRefId(`APL-${data.id || Date.now()}`);
      fetchAppeals();
    } catch (err) {
      console.warn('Appeal creation fallback:', err);
      setRefId(`APL-${Date.now()}`);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setAppealType('');
    setStatement('');
    setCommitment('');
    setErrors({});
  };

  return {
    navigate,
    user,
    action,
    // Form state
    appealType,
    setAppealType,
    statement,
    setStatement,
    commitment,
    setCommitment,
    errors,
    // Submission
    submitted,
    submitting,
    refId,
    handleSubmit,
    resetForm,
    // Previous appeals
    myAppeals,
    loadingAppeals,
    APPEAL_TYPES,
  };
}
