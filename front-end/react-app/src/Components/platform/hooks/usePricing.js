import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PLANS, PLAN_RANK } from '../data/pricingPlans';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  fetchSubscriptionStatus,
  changePlan,
  cancelSubscription,
  statusSkipped,
  selectCurrentPlan,
  selectPricingLoading,
  selectPricingSubmitting,
} from '../../../store/slices/pricingSlice';
import useToast from './useToast';

/**
 * Custom hook connecting the Pricing page to the Redux pricing slice.
 * The plan and loading flags live in the store; this hook keeps the page rules
 * (login required, owners excluded, confirm before downgrade/cancel) and toasts.
 */
export default function usePricing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const currentPlan = useSelector(selectCurrentPlan);
  const isLoading = useSelector(selectPricingLoading);
  const isSubmitting = useSelector(selectPricingSubmitting);
  const { showToast } = useToast();

  const userId = user?.id;
  const isOwner = user?.role === 'owner';

  const fetchStatus = useCallback(async () => {
    if (!userId || isOwner) {
      dispatch(statusSkipped());
      return;
    }
    try {
      await dispatch(fetchSubscriptionStatus(userId)).unwrap();
    } catch (err) {
      showToast('❌', err.message || 'Failed to load subscription status');
    }
  }, [dispatch, userId, isOwner, showToast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handlePlanChange = async (planId) => {
    if (!userId) {
      showToast('⚠️', 'Please log in to manage your subscription.');
      navigate('/login');
      return;
    }

    if (isOwner) {
      showToast('ℹ️', 'Platform Owner account cannot subscribe to individual tiers.');
      return;
    }

    const targetPlan = PLANS.find((p) => p.id === planId);
    if (!targetPlan) return;

    if (planId === currentPlan) {
      showToast('ℹ️', `You are already on the ${targetPlan.name} plan.`);
      return;
    }

    const isDowngrade = PLAN_RANK[planId] < PLAN_RANK[currentPlan];

    if (isDowngrade) {
      const confirmed = window.confirm(
        `Downgrade to ${targetPlan.name}? You'll lose access to paid features beyond the ${targetPlan.name} tier limits.`
      );
      if (!confirmed) return;
    }

    try {
      await dispatch(changePlan({ userId, plan: planId })).unwrap();
      showToast('✅', `Now on the ${targetPlan.name} plan`);
      await fetchStatus();
    } catch (err) {
      showToast('❌', err.message || 'Failed to update subscription');
    }
  };

  const handleCancelSubscription = async () => {
    if (!userId) {
      showToast('⚠️', 'Please log in to manage your subscription.');
      navigate('/login');
      return;
    }

    if (isOwner) {
      showToast('ℹ️', 'Platform Owner account cannot subscribe to individual tiers.');
      return;
    }

    if (currentPlan === 'free') {
      showToast('ℹ️', 'You are already on the Free plan.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will be reverted to the Free plan immediately.'
    );
    if (!confirmed) return;

    try {
      const message = await dispatch(cancelSubscription(userId)).unwrap();
      showToast('✅', message || 'Subscription cancelled — Reverted to the Free plan');
      await fetchStatus();
    } catch (err) {
      showToast('❌', err.message || 'Failed to cancel subscription');
    }
  };

  return {
    user,
    currentPlan,
    isLoading,
    isSubmitting,
    isOwner,
    handlePlanChange,
    handleCancelSubscription,
    refetchStatus: fetchStatus,
  };
}
