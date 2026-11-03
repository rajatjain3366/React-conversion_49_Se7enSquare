import React from 'react';

/**
 * Toast Notification Component matching commit 0cc099a.
 */
export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.show ? 'show' : ''}`} id="toast">
      {toast.icon && <span id="toastIcon">{toast.icon}</span>}
      <span id="toastMsg">{toast.msg}</span>
    </div>
  );
}
