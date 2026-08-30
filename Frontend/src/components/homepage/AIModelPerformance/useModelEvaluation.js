import { useState, useEffect, useCallback } from 'react';
import { getModelEvaluation } from '../../../services/mlPredictionClient';

/**
 * Custom React hook for fetching and managing AI Model Performance Evaluation data.
 * Handles loading, error, success, and manual retry without polling loops.
 */
export function useModelEvaluation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchIndex, setFetchIndex] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setFetchIndex(prev => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getModelEvaluation(controller.signal);
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          console.warn('[useModelEvaluation] Failed to fetch model evaluation:', err.message);
          setError(err.message || 'AI evaluation service temporarily unavailable');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fetchIndex]);

  return { data, loading, error, retry };
}
