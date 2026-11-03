import React from 'react';
import { useSelector } from 'react-redux';
import { selectToast } from '../../../store/slices/uiSlice';
import Toast from './Toast';

/**
 * The one toast for the whole app, mounted once in App.jsx.
 * Any page shows a message with dispatch(toastShown({ msg, icon })).
 */
export default function GlobalToast() {
  const toast = useSelector(selectToast);
  return <Toast toast={toast} />;
}
