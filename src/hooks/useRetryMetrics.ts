/**
 * useRetryMetrics Hook
 *
 * Tracks and monitors retry attempts, circuit breaker activations, and query failures.
 * Integrates with MetricsContext to collect metrics for analysis and debugging.
 *
 * @example
 * const metrics = useRetryMetrics()
 * metrics.recordAttempt('users-list', { circuitBreakerTripped: true })
 * metrics.recordSuccess('users-list', 150, 3)
 *
 * // Later: retrieve metrics for analysis
 * const queryMetrics = metrics.getMetrics('users-list')
 * console.log(queryMetrics.stats)
 */

import { useCallback, useRef, useMemo } from 'react'
import { useMetricsContext, type RetryMetrics } from '../contexts/MetricsContext'

export interface AttemptMetadata {
  circuitBreakerTripped?: boolean
  errorMessage?: string
}

export interface RetryMetricsHook {
  /**
   * Record a failed retry attempt
   */
  recordAttempt: (queryKey: string, metadata?: AttemptMetadata) => void

  /**
   * Record successful query completion with retry info
   */
  recordSuccess: (queryKey: string, totalDuration: number, attempts: number) => void

  /**
   * Record query failure after all retries exhausted
   */
  recordFailure: (queryKey: string, totalDuration: number, attempts: number, errorMessage?: string) => void

  /**
   * Get metrics for a specific query key
   */
  getMetrics: (queryKey: string) => {
    attempts: RetryMetrics[]
    avgDuration: number
    avgRetries: number
    successRate: number
  }

  /**
   * Clear metrics for a specific query or all
   */
  resetMetrics: (queryKey?: string) => void

  /**
   * Get all collected metrics
   */
  getAllMetrics: () => RetryMetrics[]
}

/**
 * Hook for managing retry metrics collection
 *
 * Provides methods to track retry behavior, circuit breaker activations,
 * and query success/failure patterns for monitoring and debugging.
 */
export function useRetryMetrics(): RetryMetricsHook {
  const context = useMetricsContext()
  const attemptCountersRef = useRef<Map<string, number>>(new Map())

  /**
   * Record a retry attempt in progress
   */
  const recordAttempt = useCallback(
    (queryKey: string, metadata?: AttemptMetadata) => {
      const count = attemptCountersRef.current.get(queryKey) || 0
      attemptCountersRef.current.set(queryKey, count + 1)

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `⚠️ Retry attempt ${count + 1} for "${queryKey}"${
            metadata?.circuitBreakerTripped ? ' [Circuit Breaker Tripped]' : ''
          }`
        )
      }
    },
    []
  )

  /**
   * Record successful query completion
   */
  const recordSuccess = useCallback(
    (queryKey: string, totalDuration: number, attempts: number) => {
      const metric: RetryMetrics = {
        queryKey,
        attempts,
        circuitBreakerTripped: false,
        finalStatus: 'success',
        totalDuration,
        timestamp: Date.now(),
      }

      context.recordMetric(metric)
      attemptCountersRef.current.delete(queryKey)

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `✅ Query "${queryKey}" succeeded after ${attempts} attempt(s) in ${totalDuration}ms`
        )
      }
    },
    [context]
  )

  /**
   * Record query failure after retries exhausted
   */
  const recordFailure = useCallback(
    (queryKey: string, totalDuration: number, attempts: number, errorMessage?: string) => {
      const metric: RetryMetrics = {
        queryKey,
        attempts,
        circuitBreakerTripped: false,
        finalStatus: 'failed',
        totalDuration,
        timestamp: Date.now(),
        errorMessage,
      }

      context.recordMetric(metric)
      attemptCountersRef.current.delete(queryKey)

      if (process.env.NODE_ENV === 'development') {
        console.error(
          `❌ Query "${queryKey}" failed after ${attempts} attempt(s) in ${totalDuration}ms${
            errorMessage ? `: ${errorMessage}` : ''
          }`
        )
      }
    },
    [context]
  )

  /**
   * Get metrics for a specific query key
   */
  const getMetrics = useCallback(
    (queryKey: string) => {
      const queryMetrics = context.getMetricsByQueryKey(queryKey)

      if (queryMetrics.length === 0) {
        return {
          attempts: [],
          avgDuration: 0,
          avgRetries: 0,
          successRate: 0,
        }
      }

      const totalRetries = queryMetrics.reduce((sum, m) => sum + m.attempts, 0)
      const successful = queryMetrics.filter((m) => m.finalStatus === 'success').length
      const avgDuration =
        queryMetrics.reduce((sum, m) => sum + m.totalDuration, 0) / queryMetrics.length

      return {
        attempts: queryMetrics,
        avgDuration: parseFloat(avgDuration.toFixed(2)),
        avgRetries: parseFloat((totalRetries / queryMetrics.length).toFixed(2)),
        successRate: parseFloat((((successful / queryMetrics.length) * 100).toFixed(2))),
      }
    },
    [context]
  )

  /**
   * Reset metrics (primarily for testing)
   */
  const resetMetrics = useCallback(
    (queryKey?: string) => {
      if (queryKey) {
        attemptCountersRef.current.delete(queryKey)
      } else {
        attemptCountersRef.current.clear()
        context.clearMetrics()
      }
    },
    [context]
  )

  /**
   * Get all collected metrics
   */
  const getAllMetrics = useCallback(() => {
    return context.metrics
  }, [context.metrics])

  return useMemo(
    () => ({
      recordAttempt,
      recordSuccess,
      recordFailure,
      getMetrics,
      resetMetrics,
      getAllMetrics,
    }),
    [recordAttempt, recordSuccess, recordFailure, getMetrics, resetMetrics, getAllMetrics]
  )
}
