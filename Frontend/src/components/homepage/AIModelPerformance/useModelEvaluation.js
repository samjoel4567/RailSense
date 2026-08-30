import { useState, useEffect, useCallback } from 'react';
import { getXGBoostEvaluation } from '../../../services/mlPredictionClient';

/**
 * Custom React hook for fetching and managing AI Model Performance Evaluation data from FastAPI.
 * Calls GET /model/evaluation/xgboost and handles loading, error, success, and manual retry.
 */
export function useModelEvaluation() {
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(true);
  const [evaluationError, setEvaluationError] = useState(null);
  const [fetchIndex, setFetchIndex] = useState(0);

  const retry = useCallback(() => {
    setEvaluationError(null);
    setEvaluationLoading(true);
    setFetchIndex(prev => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchData() {
      try {
        setEvaluationLoading(true);
        setEvaluationError(null);
        const result = await getXGBoostEvaluation(controller.signal);
        if (isMounted) {
          setEvaluation(result);
          setEvaluationError(null);
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          console.warn('[useModelEvaluation] Failed to fetch XGBoost evaluation:', err.message);
          setEvaluationError('Unable to load XGBoost evaluation from FastAPI.');
        }
      } finally {
        if (isMounted) {
          setEvaluationLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fetchIndex]);

  return {
    evaluation,
    evaluationLoading,
    evaluationError,
    // Aliases for backwards-compatibility
    data: evaluation,
    loading: evaluationLoading,
    error: evaluationError,
    retry
  };
}

