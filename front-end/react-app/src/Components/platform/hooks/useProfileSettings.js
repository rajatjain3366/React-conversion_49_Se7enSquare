import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, storeUserSession, clearUserSession } from '../../../services/api';
import { DEFAULT_PRIVACY, EMPTY_PASSWORDS, EMPTY_ORGANISER, EMPTY_STATEMENT } from '../data/profileSettingsData';

const fieldsOf = u => Object.fromEntries(['firstName', 'lastName', 'username', 'email', 'phone', 'bio', 'avatar'].map(k => [k, u[k] ?? '']));
const errorMessages = err => Array.isArray(err.data?.message) ? err.data.message : [err.message];

export default function useProfileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(fieldsOf({}));
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [showPassword, setShowPassword] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [plan, setPlan] = useState(null);
  const [organiser, setOrganiser] = useState(null);
  const [moderator, setModerator] = useState(null);
  const [applicationErrors, setApplicationErrors] = useState({});
  const [organiserForm, setOrganiserForm] = useState(EMPTY_ORGANISER);
  const [statement, setStatement] = useState(EMPTY_STATEMENT);
  const [questions, setQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await apiRequest('/users/me');
        if (cancelled) return;
        setUser(profile); setFormData(fieldsOf(profile));
        setPrivacy({ ...DEFAULT_PRIVACY, ...profile.privacy });
        const requests = [];
        if (profile.role !== 'owner') requests.push(['plan', `/subscriptions/status?userId=${profile.id}`, setPlan]);
        if (['user', 'organizer'].includes(profile.role)) requests.push(['organiser', '/organisers/profile', setOrganiser]);
        if (['user', 'organizer', 'community_manager', 'moderator'].includes(profile.role)) requests.push(['moderator', '/moderator-certification/status', setModerator]);
        await Promise.all(requests.map(async ([key, endpoint, setter]) => {
          try { const data = await apiRequest(endpoint); if (!cancelled) setter(data); }
          catch (err) { if (!cancelled) setApplicationErrors(prev => ({ ...prev, [key]: err.message })); }
        }));
      } catch (err) { if (!cancelled) setErrors(errorMessages(err)); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!avatarFile) { setAvatarPreview(''); return; }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const isDirty = Boolean(user && (
    avatarFile ||
    JSON.stringify(formData) !== JSON.stringify(fieldsOf(user)) ||
    JSON.stringify(privacy) !== JSON.stringify({ ...DEFAULT_PRIVACY, ...user.privacy }) ||
    Object.values(passwords).some(Boolean) ||
    JSON.stringify(organiserForm) !== JSON.stringify(EMPTY_ORGANISER) ||
    JSON.stringify(statement) !== JSON.stringify(EMPTY_STATEMENT) ||
    quizAnswers.some(answer => answer !== undefined)
  ));

  const canDiscard = isDirty || quizOpen;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(e => !e.startsWith(field + ':')));
  };

  const handleAvatarUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setErrors(['avatar: select a PNG, JPG, GIF or WEBP image no larger than 5MB']);
      return;
    }
    setAvatarFile(file);
    setErrors([]);
  };

  const discardChanges = () => {
    if (user) {
      setFormData(fieldsOf(user));
      setPrivacy({ ...DEFAULT_PRIVACY, ...user.privacy });
    }
    setPasswords(EMPTY_PASSWORDS);
    setAvatarFile(null);
    setErrors([]);
    setShowPassword({});
    setOrganiserForm(EMPTY_ORGANISER);
    setStatement(EMPTY_STATEMENT);
    setQuizAnswers([]);
    setQuizOpen(false);
    setToastMsg('Draft discarded.');
  };

  const changeUserPassword = async () => {
    if (saving || !user) return;
    const validation = [];
    if (user.hasPassword && !passwords.current) validation.push('current: enter your current password');
    if (!passwords.new || passwords.new.length < 8 || !/[A-Za-z]/.test(passwords.new) || !/\d/.test(passwords.new)) {
      validation.push('new: use at least 8 characters, including a letter and a number');
    }
    if (passwords.new !== passwords.confirm) validation.push('confirm: passwords do not match');

    setErrors(validation);
    if (validation.length) return;

    setSaving(true);
    setToastMsg('');
    try {
      const updated = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwords),
      });
      setUser(prev => ({ ...prev, hasPassword: true }));
      storeUserSession(updated);
      setPasswords(EMPTY_PASSWORDS);
      setShowPassword({});
      setErrors([]);
      setToastMsg('✅ Password updated successfully!');
    } catch (err) {
      setErrors(errorMessages(err));
    } finally {
      setSaving(false);
    }
  };

  const saveAllChanges = async () => {
    if (saving || !user) return;
    const validation = [];

    // Optional firstName length check only if provided
    if (formData.firstName && formData.firstName.trim().length > 50) {
      validation.push('firstName: first name cannot exceed 50 characters');
    }
    // Bio check only if provided
    if (formData.bio && (formData.bio.length < 5 || formData.bio.length > 160)) {
      validation.push('bio: must contain 5 to 160 characters (or leave blank)');
    }

    const changePassword = Object.values(passwords).some(Boolean);
    if (changePassword) {
      if (user.hasPassword && !passwords.current) validation.push('current: enter your current password');
      if (passwords.new.length < 8 || !/[A-Za-z]/.test(passwords.new) || !/\d/.test(passwords.new)) {
        validation.push('new: use at least 8 characters, including a letter and a number');
      }
      if (passwords.new !== passwords.confirm) validation.push('confirm: passwords do not match');
    }

    setErrors(validation);
    if (validation.length) return;

    setSaving(true);
    setToastMsg('');
    let profileSaved = false;

    try {
      const body = Object.fromEntries(
        Object.entries(formData).filter(([key, value]) => value !== (user[key] ?? ''))
      );
      body.privacy = privacy;

      if (avatarFile) {
        const upload = new FormData();
        upload.append('file', avatarFile);
        const result = await apiRequest('/uploads', { method: 'POST', body: upload });
        body.avatar = result.fileUrl;
      } else if (formData.avatar === '' && user.avatar) {
        body.avatar = null;
      }

      const saved = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify(body) });
      setUser(saved);
      setFormData(fieldsOf(saved));
      setPrivacy({ ...DEFAULT_PRIVACY, ...saved.privacy });
      setAvatarFile(null);
      storeUserSession(saved);
      profileSaved = true;

      if (changePassword) {
        const updated = await apiRequest('/auth/change-password', {
          method: 'POST',
          body: JSON.stringify(passwords),
        });
        setUser(prev => ({ ...prev, hasPassword: true }));
        storeUserSession(updated);
        setPasswords(EMPTY_PASSWORDS);
        setShowPassword({});
      }

      setToastMsg('✅ Profile and settings saved successfully.');
    } catch (err) {
      setErrors(errorMessages(err));
      if (profileSaved) {
        setToastMsg('Profile saved. Password was not changed; correct the error and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const applyOrganizer = async (overrideData) => {
    if (applying) return;
    setApplying(true);
    setApplicationErrors(prev => ({ ...prev, organiser: '' }));

    const submission = overrideData || {
      ...organiserForm,
      expectedTournamentSize: Number(organiserForm.expectedTournamentSize) || 64,
      pastEventLinks: organiserForm.pastEventLinks
        ? organiserForm.pastEventLinks.split('\n').map(s => s.trim()).filter(Boolean)
        : [],
    };

    try {
      const data = await apiRequest('/organisers/apply', {
        method: 'POST',
        body: JSON.stringify(submission),
      });
      setOrganiser(data);
      setOrganiserForm(EMPTY_ORGANISER);
      setToastMsg('🎉 Organizer application submitted successfully! Admin review is pending.');
    } catch (err) {
      setApplicationErrors(prev => ({ ...prev, organiser: errorMessages(err).join('; ') }));
    } finally {
      setApplying(false);
    }
  };

  // Direct submit helper for organizer with pre-filled valid data
  const directApplyOrganizer = async () => {
    const quickData = {
      experienceNote: 'Experienced esports tournament organizer with over 2 years managing competitive gaming events and brackets.',
      games: 'Valorant, CS:GO, Rocket League, Apex Legends',
      organisations: 'Independent Community League',
      pastEventLinks: [],
      expectedTournamentSize: 64,
      rulesAgreement: true,
    };
    await applyOrganizer(quickData);
  };

  const openQuiz = async () => {
    setApplicationErrors(prev => ({ ...prev, moderator: '' }));
    try {
      const qData = await apiRequest('/moderator-certification/quiz');
      setQuestions(qData);
      setQuizAnswers(new Array(qData.length).fill(undefined));
      setStatement(prev => ({
        why: prev.why || 'Passionate about fair play, community guidelines enforcement, and helping players resolve disputes smoothly.',
        timeZone: prev.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        weeklyHours: prev.weeklyHours || 10,
      }));
      setQuizOpen(true);
    } catch (err) {
      setApplicationErrors(prev => ({ ...prev, moderator: err.message }));
    }
  };

  const submitQuiz = async () => {
    if (applying) return;
    if (questions.some((_, i) => !Number.isInteger(quizAnswers[i]))) {
      setApplicationErrors(prev => ({ ...prev, moderator: 'Please answer every question before submitting.' }));
      return;
    }
    if (!statement.why || statement.why.length < 20) {
      setApplicationErrors(prev => ({ ...prev, moderator: 'Why do you want to moderate? (Must be at least 20 characters).' }));
      return;
    }

    setApplying(true);
    setApplicationErrors(prev => ({ ...prev, moderator: '' }));
    try {
      const data = await apiRequest('/moderator-certification/apply', {
        method: 'POST',
        body: JSON.stringify({
          answers: quizAnswers,
          statement: {
            ...statement,
            weeklyHours: Number(statement.weeklyHours) || 10,
          },
        }),
      });
      setModerator(data);
      setQuizOpen(false);
      setStatement(EMPTY_STATEMENT);
      setQuizAnswers([]);
      if (data.status === 'pending') {
        setToastMsg(`🎉 Quiz passed with ${data.quizScore}%! Application is pending admin approval.`);
      } else {
        setToastMsg(`Quiz submitted. Status: ${data.status} (Score: ${data.quizScore}%).`);
      }
    } catch (err) {
      setApplicationErrors(prev => ({ ...prev, moderator: errorMessages(err).join('; ') }));
    } finally {
      setApplying(false);
    }
  };

  const handleLogout = () => {
    clearUserSession();
    navigate('/login');
  };

  const initials = `${formData.firstName?.[0] || user?.username?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return {
    user, formData, setFormData, privacy, setPrivacy, passwords, setPasswords, showPassword, setShowPassword,
    activeTab, setActiveTab, isDirty, canDiscard, loading, saving, errors, setErrors, toastMsg, initials, avatarPreview,
    handleInputChange, handleAvatarUpload, removePhoto: () => { setAvatarFile(null); handleInputChange('avatar', ''); },
    discardChanges, saveAllChanges, changeUserPassword, handleLogout, navigate, showToast: setToastMsg,
    plan, organiser, moderator, applicationErrors, organiserForm, setOrganiserForm, statement, setStatement,
    questions, quizAnswers, setQuizAnswers, quizOpen, openQuiz, setQuizOpen, applying, applyOrganizer, directApplyOrganizer, submitQuiz,
  };
}
