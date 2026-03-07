/**
 * Resilience Framework Types
 *
 * Types for implementing resilient query patterns with exponential backoff
 * and circuit breaker patterns.
 */

/**
 * Circuit breaker state tracking for a query
 */
export interface CircuitBreakerState {
  /** Number of consecutive failures */
  failureCount: number
  /** Total number of attempts (including successes) */
  totalAttempts: number
  /** Timestamp of the last failure */
  lastFailureTime: number
  /** Whether the circuit breaker is currently open (tripped) */
  isOpen: boolean
}

/**
 * Configuration for retry behavior with exponential backoff
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number
  /** Initial delay in milliseconds before first retry */
  baseDelay: number
  /** Maximum delay in milliseconds (cap for exponential backoff) */
  maxDelay: number
  /** Threshold of consecutive failures before circuit breaker trips */
  circuitBreakerThreshold: number
}

/**
 * Default retry configuration values
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  circuitBreakerThreshold: 5,
}

/**
 * Resilient query options
 */
export interface ResilientQueryOptions<
  TData = unknown,
  TError = Error,
  TQueryKey extends readonly unknown[] = readonly unknown[]
> {
  /** Query key for caching */
  queryKey: TQueryKey
  /** Query function to execute */
  queryFn: () => Promise<TData>
  /** Retry configuration (optional, uses defaults if not provided) */
  retryConfig?: Partial<RetryConfig>
  /** Callback when query succeeds */
  onSuccess?: (data: TData) => void
  /** Callback when query fails permanently */
  onError?: (error: TError) => void
}

/**
 * Result from a resilient query
 */
export interface ResilientQueryResult<TData = unknown, TError = Error> {
  /** Query data */
  data: TData | undefined
  /** Loading state */
  isLoading: boolean
  /** Error state */
  isError: boolean
  /** Error object if error occurred */
  error: TError | null
  /** Whether circuit breaker is open */
  isCircuitBreakerOpen: boolean
  /** Current retry attempt */
  retryAttempt: number
  /** Retry the query manually */
  retry: () => void
}
