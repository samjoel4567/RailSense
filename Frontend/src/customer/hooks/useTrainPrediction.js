import { useCustomerData } from '../context/CustomerDataContext';

/**
 * Hook to access a specific train's live prediction and ETA details
 */
export function useTrainPrediction(trainId) {
  const { trains, isLiveBackend, secondsAgo, dataStatus } = useCustomerData();

  const train = trains.find(t => t.id === trainId || t.id.replace(/_/g, '-') === trainId) || null;

  return {
    train,
    predictedArrival: train?.predictedArrival || null,
    expectedDelayMinutes: train?.expectedDelayMinutes ?? 0,
    delayStatusText: train?.delayStatusText || 'On time',
    isDelayed: Boolean(train?.isDelayed),
    isLiveBackend,
    secondsAgo,
    dataStatus
  };
}
