import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { APPEAL_TYPES } from '../data/appealData';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { fetchMyProfile, selectProfile } from '../../../store/slices/profileSlice';
import {
  fetchActiveSanction,
  fetchMyAppeals,
  submitAppeal,
  selectAppealState,
} from '../../../store/slices/appealSlice';

/**
 * Connects the Appeal page to Redux: account status from the profile slice,
 * the active sanction and the user's appeals from the appeal slice.
 * Restriction details come from URL params (set by the Login redirect) when present.
 * The appeal form itself is page-only state.
 */
export default function useAppeal() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const sessionUser = useSelector(selectCurrentUser);
  const profile = useSelector(selectProfile);
  const { sanction, myAppeals, loadingAppeals, submitting } = useSelector(selectAppealState);

  // Session data first, replaced by the fresh profile (status & reason) once loaded
  const source = profile || sessionUser;
  const user = {
    role: sessionUser?.role || 'user',
    firstName: source?.firstName || 'User',
    username: source?.username || 'user',
    id: sessionUser?.id || null,
    status: source?.status || 'active',
    statusReason: source?.statusReason || '',
  };

  // Restriction from the login redirect, if any
  const [urlAction] = useState(() => {
    const code = searchParams.get('accountStatus');
    if (!code) return null;
    return {
      type: code === 'ACCOUNT_BANNED' ? 'Account Ban' : 'Account Suspension',
      reason: searchParams.get('reason') || 'Violation of community guidelines',
      until: searchParams.get('until') || null,
      id: `SAN-${Date.now()}`,
    };
  });
  const action = urlAction || sanction;

  const [appealType, setAppealType] = useState('');
  const [statement, setStatement] = useState('');
  const [commitment, setCommitment] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');

  // Thunk conditions skip all three when nobody is logged in
  useEffect(() => {
    dispatch(fetchMyProfile());
    dispatch(fetchMyAppeals());
    // The sanctions endpoint may be unavailable if banned: that's ok, action stays null
    if (!urlAction) dispatch(fetchActiveSanction());
  }, [dispatch, urlAction, sessionUser?.id]);

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

    // POST /appeals needs a logged-in user (x-user-id header). Banned or
    // suspended users cannot log in, so without a session the request can
    // only fail. Say so honestly instead of showing a fake reference.
    if (!user.id) {
      setErrors({
        submit: 'You must be logged in to submit an appeal. Banned or suspended accounts cannot log in, so please contact an administrator.',
      });
      return;
    }

    const payload = {
      userId: Number(user.id),
      actionId: action?.id || `ACT-${Date.now()}`,
      text: statement.trim(),
      acknowledgement: (commitment || 'I agree to the platform community guidelines').slice(0, 95),
      resolution: (appealType || 'Reconsideration').slice(0, 95),
      evidence: [],
    };

    // Show the success screen only with the real appeal ID from the backend
    try {
      const id = await dispatch(submitAppeal(payload)).unwrap();
      setRefId(`APL-${id}`);
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: `Appeal not sent: ${err.message}` });
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
