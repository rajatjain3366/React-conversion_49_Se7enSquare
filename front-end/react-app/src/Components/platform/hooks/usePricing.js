import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS, PLAN_RANK } from '../data/pricingPlans';
import { getStoredUser, apiRequest } from '../../../services/api';
import useToast from './useToast';

/**
 * Custom hook managing all Pricing page state, RBAC, and network actions.
 */
export default function usePricing() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const isOwner = user?.role === 'owner';

  const fetchStatus = useCallback(async () => {
    if (!user || !user.id || isOwner) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await apiRequest(`/subscriptions/status?userId=${user.id}`);
      if (data && data.plan) {
        setCurrentPlan(data.plan);
      }
    } catch (err) {
      showToast('❌', err.message || 'Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  }, [user, isOwner, showToast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handlePlanChange = async (planId) => {
    if (!user || !user.id) {
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

    setIsSubmitting(true);
    try {
      const res = await apiRequest('/subscriptions/upgrade', {
        method: 'POST',
        body: JSON.stringify({ userId: Number(user.id), plan: planId }),
      });

      if (res && res.plan) {
        setCurrentPlan(res.plan);
      }
      showToast('✅', `Now on the ${targetPlan.name} plan`);
      await fetchStatus();
    } catch (err) {
      showToast('❌', err.message || 'Failed to update subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !user.id) {
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

    setIsSubmitting(true);
    try {
      const res = await apiRequest('/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify({ userId: Number(user.id) }),
      });
      setCurrentPlan('free');
      showToast('✅', res?.message || 'Subscription cancelled — Reverted to the Free plan');
      await fetchStatus();
    } catch (err) {
      showToast('❌', err.message || 'Failed to cancel subscription');
    } finally {
      setIsSubmitting(false);
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

