import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toastShown } from '../../../store/slices/uiSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  fetchCommunityList,
  createCommunity,
  addChannel,
  selectCommunityList,
} from '../../../store/slices/communitiesSlice';
import {
  URL_PATTERN, CATEGORIES, ICONS, BANNERS, DEFAULT_CHANNELS, DEFAULT_PERMISSIONS,
} from '../data/createCommunityOptions';


/**
 * Manages form state, validation, submission guard, and channel CRUD for
 * the CreateCommunity wizard, plus the standalone channel creation flow.
 * The wizard fields are local form state; creating the community and adding a
 * channel go through the Redux communities slice, so the new community shows on
 * Discovery (and as joined) without another fetch.
 */
export default function useCreateCommunity(navigate) {
  const [activeTab, setActiveTab] = useState('community');
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const allCommunities = useSelector(selectCommunityList);

  // Form State - Community
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [banner, setBanner] = useState(BANNERS[0]);
  const [website, setWebsite] = useState('');
  const [tags, setTags] = useState('');
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [privacy, setPrivacy] = useState('public');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [rules, setRules] = useState('');
  const [welcomeMsg, setWelcomeMsg] = useState('');

  // Add channel sub-form in Step 3
  const [showAddCh, setShowAddCh] = useState(false);
  const [newChName, setNewChName] = useState('');
  const [newChDesc, setNewChDesc] = useState('');
  const [newChType, setNewChType] = useState('Text');

  // Form State - Standalone Channel Flow
  const [channelCommId, setChannelCommId] = useState('');
  const [standaloneChName, setStandaloneChName] = useState('');
  const [standaloneChTopic, setStandaloneChTopic] = useState('');
  const [standaloneChType, setStandaloneChType] = useState('Text');

  const showToast = (msg) => dispatch(toastShown({ msg }));

  useEffect(() => {
    dispatch(fetchCommunityList());
  }, [dispatch]);

  // Pre-select the first community for the standalone channel form
  useEffect(() => {
    if (!channelCommId && allCommunities.length > 0) {
      setChannelCommId(String(allCommunities[0].id));
    }
  }, [allCommunities, channelCommId]);

  const handleNameChange = (val) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  };

  const handleAddChannel = () => {
    if (!newChName.trim()) {
      showToast('⚠️ Channel name is required');
      return;
    }
    const clean = newChName.trim().toLowerCase().replace(/\s+/g, '-');
    const chIcon = newChType === 'Voice' ? '🎙' : newChType === 'Announcement' ? '📢' : '💬';
    setChannels([
      ...channels,
      { id: Date.now(), name: clean, type: newChType, icon: chIcon, desc: newChDesc || 'Community channel' },
    ]);
    setNewChName('');
    setNewChDesc('');
    setShowAddCh(false);
  };

  const handleDeleteChannel = (id) => {
    setChannels(channels.filter((c) => c.id !== id));
  };

  // Limits mirror the backend CreateCommunityDto so users never type a
  // payload the server would reject.
  const validateStep = (step) => {
    if (step === 1) {
      const n = name.trim();
      if (n.length < 3) { showToast('⚠️ Community name must be at least 3 characters'); return false; }
      if (n.length > 50) { showToast('⚠️ Community name must be at most 50 characters'); return false; }
      const d = desc.trim();
      if (d.length < 10) { showToast('⚠️ Description must be at least 10 characters'); return false; }
      if (d.length > 200) { showToast('⚠️ Description must be at most 200 characters'); return false; }
    }
    if (step === 2) {
      if (website.trim() && !URL_PATTERN.test(website.trim())) {
        showToast('⚠️ Please enter a valid website URL'); return false;
      }
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 5) { showToast('⚠️ Up to 5 tags are allowed'); return false; }
      if (tagList.some((t) => t.length < 2 || t.length > 20)) {
        showToast('⚠️ Each tag must be 2–20 characters'); return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      submitCreateCommunity();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const submitCreateCommunity = async () => {
    if (submitting) return;
    if (!user || user.id === undefined || user.id === null) {
      showToast('⚠️ You must be logged in to create a community.');
      return;
    }
    setSubmitting(true);
    showToast('🚀 Creating community…');
    const channelNames = channels.map((c) => c.name);
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

    const payload = {
      name: name.trim(),
      description: desc.trim(),
      ownerId: Number(user.id),
      category,
      icon,
      banner,
      slug: slug || 'community',
      channels: channelNames.length ? channelNames : ['general'],
      tags: tagList.length ? tagList : [category.toLowerCase()],
      visibility: privacy,
      memberCount: 1,
      onlineCount: 1,
      ...(rules.trim()
        ? { rules: rules.trim().split('\n').map((r) => r.trim()).filter(Boolean) }
        : {}),
    };

    try {
      // The slice adds it to the list and to the joined ids
      const created = await dispatch(createCommunity(payload)).unwrap();
      showToast('🎉 Community created! Redirecting…');
      setTimeout(() => { navigate(`/community-page?id=${created.id}`); }, 1000);
    } catch (err) {
      showToast(`⚠️ Could not create community: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const submitCreateChannel = async () => {
    if (!standaloneChName.trim()) { showToast('⚠️ Channel name is required'); return; }
    if (!standaloneChTopic.trim()) { showToast('⚠️ Channel topic is required'); return; }
    if (!channelCommId) { showToast('⚠️ Select a community first'); return; }
    showToast('💬 Creating channel…');
    try {
      const { communityName, channel } = await dispatch(addChannel({
        communityId: channelCommId,
        name: standaloneChName,
        type: standaloneChType,
      })).unwrap();
      showToast(`✅ #${channel.name} created in ${communityName}!`);
      setTimeout(() => { navigate(`/community-page?id=${channelCommId}`); }, 1000);
    } catch (err) {
      showToast(`⚠️ Could not reach the backend: ${err.message}`);
    }
  };

  return {
    // Tab + step
    activeTab, setActiveTab,
    currentStep, setCurrentStep,
    submitting,
    // Community form fields
    name, desc, slug, category, icon, banner, website, tags,
    channels, privacy, permissions, rules, welcomeMsg,
    setDesc, setSlug, setCategory, setIcon, setBanner,
    setWebsite, setTags, setPrivacy, setPermissions,
    setRules, setWelcomeMsg,
    handleNameChange,
    // Channel sub-form
    showAddCh, setShowAddCh,
    newChName, setNewChName,
    newChDesc, setNewChDesc,
    newChType, setNewChType,
    handleAddChannel, handleDeleteChannel,
    // Standalone channel flow
    allCommunities, channelCommId, setChannelCommId,
    standaloneChName, setStandaloneChName,
    standaloneChTopic, setStandaloneChTopic,
    standaloneChType, setStandaloneChType,
    // Navigation handlers
    nextStep, prevStep,
    submitCreateChannel,
    validateStep,
  };
}
