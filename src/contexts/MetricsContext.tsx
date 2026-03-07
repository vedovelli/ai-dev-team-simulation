/**
 * Metrics Context for tracking retry behavior and circuit breaker activation
 *
 * Provides metrics collection and analysis for resilient query patterns:
 * - Retry attempt tracking
 * - Circuit breaker activation logging
 * - Success rate analysis
 * - Query failure patterns
 */

import React, { createContext, useCallback, useMemo, useState } from 'react'

export interface RetryMetrics {
  queryKey: string
  attempts: number
  circuitBreakerTripped: boolean
  finalStatus: 'success' | 'failed'
  totalDuration: number
  timestamp: number
  lastAttemptTime?: number
  errorMessage?: string
}

export interface MetricsStats {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  circuitBreakerTrips: number
  averageRetryCount: number
  successRateAfterRetries: number
}

export interface MetricsContextType {
  metrics: RetryMetrics[]
  stats: MetricsStats
  recordMetric: (metric: RetryMetrics) => void
  clearMetrics: () => void
  getMetricsByQueryKey: (queryKey: string) => RetryMetrics[]
  exportMetrics: () => string
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined)

/**
 * Metrics Provider Component
 * Wraps the app to provide metrics collection and analysis
 */
export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = useState<RetryMetrics[]>([])

  /**
   * Record a new retry metric
   */
  const recordMetric = useCallback((metric: RetryMetrics) => {
    setMetrics((prev) => [...prev, metric])

    // Dev-time logging
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔄 Retry Metric: ${metric.queryKey}`)
      console.log('Attempts:', metric.attempts)
      console.log('Circuit Breaker Tripped:', metric.circuitBreakerTripped)
      console.log('Final Status:', metric.finalStatus)
      console.log('Total Duration:', `${metric.totalDuration}ms`)
      if (metric.errorMessage) {
        console.log('Error:', metric.errorMessage)
      }
      console.groupEnd()
    }
  }, [])

  /**
   * Clear all metrics (useful for testing/debugging)
   */
  const clearMetrics = useCallback(() => {
    setMetrics([])
  }, [])

  /**
   * Get metrics for a specific query key
   */
  const getMetricsByQueryKey = useCallback(
    (queryKey: string): RetryMetrics[] => {
      return metrics.filter((m) => m.queryKey === queryKey)
    },
    [metrics]
  )

  /**
   * Calculate aggregated statistics
   */
  const stats = useMemo<MetricsStats>(() => {
    if (metrics.length === 0) {
      return {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        circuitBreakerTrips: 0,
        averageRetryCount: 0,
        successRateAfterRetries: 0,
      }
    }

    const successful = metrics.filter((m) => m.finalStatus === 'success').length
    const failed = metrics.filter((m) => m.finalStatus === 'failed').length
    const circuitTrips = metrics.filter((m) => m.circuitBreakerTripped).length
    const totalAttempts = metrics.reduce((sum, m) => sum + m.attempts, 0)
    const avgRetries = totalAttempts / metrics.length

    return {
      totalQueries: metrics.length,
      successfulQueries: successful,
      failedQueries: failed,
      circuitBreakerTrips: circuitTrips,
      averageRetryCount: parseFloat(avgRetries.toFixed(2)),
      successRateAfterRetries: parseFloat(
        ((successful / metrics.length) * 100).toFixed(2)
      ),
    }
  }, [metrics])

  /**
   * Export metrics as JSON string
   */
  const exportMetrics = useCallback((): string => {
    return JSON.stringify({ metrics, stats }, null, 2)
  }, [metrics, stats])

  const value = useMemo<MetricsContextType>(
    () => ({
      metrics,
      stats,
      recordMetric,
      clearMetrics,
      getMetricsByQueryKey,
      exportMetrics,
    }),
    [metrics, stats, recordMetric, clearMetrics, getMetricsByQueryKey, exportMetrics]
  )

  return <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>
}

/**
 * Hook to access metrics functionality
 * Must be used inside a MetricsProvider
 */
export function useMetricsContext() {
  const context = React.useContext(MetricsContext)
  if (!context) {
    throw new Error('useMetricsContext must be used within a MetricsProvider')
  }
  return context
}
