import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toastShown } from '../../../store/slices/uiSlice';
import {
  fetchCommunitySettings,
  saveCommunitySettings,
  removeMember,
  uploadBanner,
  fieldChanged,
  memberRoleChanged,
  channelDeleted,
  channelCreated,
  changesDiscarded,
  selectCommunitySettings,
} from '../../../store/slices/communitySettingsSlice';

/**
 * Custom hook connecting the Community Settings page to the Redux communitySettings slice.
 * The community draft, snapshot and dirty flag live in the store; the active tab and the
 * create-channel modal are page-only UI, so they stay in local state.
 */
export default function useCommunitySettings() {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const communityId = paramId || searchParams.get('id') || '1';

  const dispatch = useDispatch();
  const { community, loading, isDirty } = useSelector(selectCommunitySettings);

  const [activeTab, setActiveTab] = useState('basic');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newChName, setNewChName] = useState('');
  const [newChType, setNewChType] = useState('Text');

  const showToast = (msg) => dispatch(toastShown({ msg }));

  useEffect(() => {
    dispatch(fetchCommunitySettings(communityId));
  }, [dispatch, communityId]);

  const handleFieldChange = (field, value) => {
    dispatch(fieldChanged({ field, value }));
  };

  const handleMemberRoleChange = (memberId, newRole) => {
    dispatch(memberRoleChanged({ memberId, role: newRole }));
    showToast(`Role updated to ${newRole}`);
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await dispatch(removeMember(memberId)).unwrap();
      showToast('✅ Member removed');
    } catch (err) {
      showToast(`⚠️ ${err.message || 'Could not remove member'}`);
    }
  };

  const handleDeleteChannel = (channelId) => {
    dispatch(channelDeleted(channelId));
    showToast('Channel deleted');
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChName.trim()) {
      showToast('⚠️ Channel name is required');
      return;
    }
    const action = dispatch(channelCreated({ name: newChName, type: newChType }));
    setNewChName('');
    setModalOpen(false);
    showToast(`Channel #${action.payload.name} created`);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await dispatch(uploadBanner(file)).unwrap();
      showToast('📷 Banner updated! Save to persist.');
    } catch (err) {
      showToast(`⚠️ ${err.message || 'Banner upload failed'}`);
    }
  };

  const saveSettings = async () => {
    try {
      await dispatch(saveCommunitySettings()).unwrap();
      showToast('✅ Community settings saved successfully!');
    } catch (err) {
      showToast(`⚠️ ${err.message || 'Could not save settings'}`);
    }
  };

  const discardSettings = () => {
    dispatch(changesDiscarded());
    showToast('Changes discarded.');
  };

  return {
    communityId,
    activeTab,
    setActiveTab,
    loading,
    isDirty,
    community,
    modalOpen,
    setModalOpen,
    newChName,
    setNewChName,
    newChType,
    setNewChType,
    handleFieldChange,
    handleMemberRoleChange,
    handleRemoveMember,
    handleDeleteChannel,
    handleCreateChannel,
    handleBannerUpload,
    saveSettings,
    discardSettings,
  };
}
