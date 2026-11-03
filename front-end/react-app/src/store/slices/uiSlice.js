import { createSlice } from '@reduxjs/toolkit';

const SIDEBAR_KEY = 'nexus_sidebar_collapsed';

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * UI slice: app-wide interface state that is not tied to one page.
 * - toast: the single toast shown by <GlobalToast /> for every page
 * - sidebarCollapsed: whether the left sidebar is collapsed
 * Hiding the toast after its duration and saving the sidebar flag to
 * localStorage are side effects, so they live in the listener middleware.
 */
const initialState = {
  toast: { show: false, icon: '', msg: '', duration: 3000 },
  sidebarCollapsed: readSidebarCollapsed(),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toastShown: {
      reducer(state, action) {
        state.toast = { show: true, ...action.payload };
      },
      // dispatch(toastShown({ msg, icon?, duration? }))
      prepare({ msg, icon = '', duration = 3000 }) {
        return { payload: { msg, icon, duration } };
      },
    },
    toastHidden(state) {
      state.toast.show = false;
    },
    sidebarToggled(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { toastShown, toastHidden, sidebarToggled } = uiSlice.actions;

// Selectors
export const selectToast = (state) => state.ui.toast;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;

export { SIDEBAR_KEY };
export default uiSlice.reducer;
