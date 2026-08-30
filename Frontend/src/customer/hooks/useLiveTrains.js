import { useCustomerData } from '../context/CustomerDataContext';

/**
 * Hook to access live trains with optional filter/search
 */
export function useLiveTrains(filterQuery = '') {
  const { trains, isLoadingInitial, isLiveBackend, dataStatus, secondsAgo } = useCustomerData();

  const filteredTrains = trains.filter(t => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.trainNumber.toLowerCase().includes(q) ||
      t.origin.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.currentLocation.toLowerCase().includes(q)
    );
  });

  return {
    trains: filteredTrains,
    totalCount: trains.length,
    isLoading: isLoadingInitial,
    isLiveBackend,
    dataStatus,
    secondsAgo
  };
}
