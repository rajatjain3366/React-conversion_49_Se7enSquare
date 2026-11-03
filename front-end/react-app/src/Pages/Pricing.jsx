import React from 'react';
import AppShell from '../Components/platform/layout/AppShell';
import usePricing from '../Components/platform/hooks/usePricing';
import PricingHeader from './Pricing/components/PricingHeader';
import PlanGrid from './Pricing/components/PlanGrid';
import CancelSubscriptionCard from './Pricing/components/CancelSubscriptionCard';
import '../styles/pricing.css';

/**
 * Pricing Page Component
 * Displays subscription tiers, current plan status from DB,
 * upgrade/downgrade switching, and subscription cancellation.
 */
export default function Pricing() {
  const {
    user,
    currentPlan,
    isLoading,
    isSubmitting,
    isOwner,
    handlePlanChange,
    handleCancelSubscription,
  } = usePricing();

  return (
    <AppShell
      headerIcon="💎"
      headerTitle="Pricing & Subscription"
      headerBadge="PLANS"
    >
      <div className="pricing-page active">
        {isOwner && (
          <div
            className="notice-pill"
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(91, 110, 245, 0.12)',
              border: '1px solid rgba(91, 110, 245, 0.3)',
              color: '#c7d2fe',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>👑</span>
            <span>
              <strong>Platform Owner View:</strong> You have system-wide administrative access.
              Individual subscriber plans are managed by players and organizers.
            </span>
          </div>
        )}
        <PricingHeader />
        <PlanGrid
          currentPlan={currentPlan}
          onPlanChange={handlePlanChange}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          isOwner={isOwner}
        />
        <CancelSubscriptionCard
          onCancel={handleCancelSubscription}
          currentPlan={currentPlan}
          isSubmitting={isSubmitting}
          isOwner={isOwner}
          user={user}
        />
      </div>
    </AppShell>
  );
}

