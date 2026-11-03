// Custom hook to show a toast message through the app-wide Redux toast (auto-dismissed by the store).
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { toastShown } from '../../../store/slices/uiSlice';

export function useToast(defaultDuration = 3000) {
  const dispatch = useDispatch();

  const showToast = useCallback((msg, duration = defaultDuration) => {
    dispatch(toastShown({ msg, duration }));
  }, [dispatch, defaultDuration]);

  return { showToast };
}
