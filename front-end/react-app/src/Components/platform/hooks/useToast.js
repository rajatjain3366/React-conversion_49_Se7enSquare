import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { toastShown } from '../../../store/slices/uiSlice';

/**
 * Shows a message in the app-wide toast (Redux ui slice, rendered by <GlobalToast />).
 * Usage: const { showToast } = useToast(); showToast('✅', 'Saved');
 */
export default function useToast() {
  const dispatch = useDispatch();

  const showToast = useCallback((icon, msg) => {
    dispatch(toastShown({ icon, msg, duration: 2800 }));
  }, [dispatch]);

  return { showToast };
}
