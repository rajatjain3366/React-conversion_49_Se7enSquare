import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../services/api';
import { logout } from './authSlice';

/**
 * Pricing slice: the logged-in user's subscription plan.
 * Kept in the store (not in the Pricing page) so any component can read the plan.
 */

// GET /subscriptions/status?userId= -> { plan }
export const fetchSubscriptionStatus = createAsyncThunk(
  'pricing/fetchSubscriptionStatus',
  async (userId) => {
    const data = await apiRequest(`/subscriptions/status?userId=${userId}`);
    return data?.plan || 'free';
  }
);

// POST /subscriptions/upgrade { userId, plan } (also used for downgrades)
export const changePlan = createAsyncThunk(
  'pricing/changePlan',
  async ({ userId, plan }) => {
    const res = await apiRequest('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId), plan }),
    });
    return res?.plan || plan;
  }
);

// POST /subscriptions/cancel { userId } -> back to free
export const cancelSubscription = createAsyncThunk(
  'pricing/cancelSubscription',
  async (userId) => {
    const res = await apiRequest('/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId) }),
    });
    return res?.message || null;
  }
);

const initialState = {
  currentPlan: 'free',
  isLoading: true,
  isSubmitting: false,
  error: null,
};

const pricingSlice = createSlice({
  name: 'pricing',
  initialState,
  reducers: {
    // Logged-out users and platform owners have no plan to load
    statusSkipped(state) {
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPlan = action.payload;
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(changePlan.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(changePlan.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentPlan = action.payload;
      })
      .addCase(changePlan.rejected, (state) => {
        state.isSubmitting = false;
      })
      .addCase(cancelSubscription.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.isSubmitting = false;
        state.currentPlan = 'free';
      })
      .addCase(cancelSubscription.rejected, (state) => {
        state.isSubmitting = false;
      })
      // A different user may log in next, so forget this user's plan
      .addCase(logout, () => initialState);
  },
});

export const { statusSkipped } = pricingSlice.actions;

export const selectCurrentPlan = (state) => state.pricing.currentPlan;
export const selectPricingLoading = (state) => state.pricing.isLoading;
export const selectPricingSubmitting = (state) => state.pricing.isSubmitting;

export default pricingSlice.reducer;
