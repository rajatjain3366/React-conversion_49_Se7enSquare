import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import {
  fetchOwnerOverview,
  openDrill as openDrillThunk,
  drillClosed,
  selectOwnerStats,
  selectOwnerRevenue,
  selectDrill,
} from '../../../store/slices/ownerDashboardSlice';

/**
 * Connects OwnerDashboard to the Redux ownerDashboard slice.
 * Presentation components render the drill-down tables; the data comes from the store.
 */
export default function useOwnerDashboard() {
  const dispatch = useDispatch();
  const sessionUser = useSelector(selectCurrentUser);
  const currentUser = {
    id: sessionUser?.id,
    username: sessionUser?.username || 'owner',
    firstName: sessionUser?.firstName || 'Owner',
    lastName: sessionUser?.lastName || '',
    role: sessionUser?.role || 'owner',
  };

  const stats = useSelector(selectOwnerStats);
  const revenue = useSelector(selectOwnerRevenue);
  const drill = useSelector(selectDrill);

  useEffect(() => {
    dispatch(fetchOwnerOverview());
  }, [dispatch]);

  const openDrill = (kind, filter) => dispatch(openDrillThunk({ kind, filter }));

  // The page only ever closes the modal (onClose -> setDrillModalOpen(false))
  const setDrillModalOpen = (open) => {
    if (!open) dispatch(drillClosed());
  };

  return {
    currentUser,
    stats,
    revenue,
    drillModalOpen: drill.open,
    setDrillModalOpen,
    drillTitle: drill.title,
    drillLoading: drill.loading,
    drillContent: drill.content,
    openDrill,
  };
}
