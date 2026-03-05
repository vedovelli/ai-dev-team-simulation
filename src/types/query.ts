import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'

/**
 * Retry configuration for queries with exponential backoff
 */
export interface QueryRetryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Initial delay in milliseconds before first retry */
  initialDelayMs?: number
  /** Maximum delay in milliseconds (cap for exponential backoff) */
  maxDelayMs?: number
  /** Multiplier for exponential backoff calculation */
  backoffMultiplier?: number
  /** Custom logic to determine if an error should trigger a retry */
  shouldRetry?: (error: unknown, failureCount: number) => boolean
}

/**
 * Extended query options with retry configuration
 */
export interface ExtendedQueryOptions<
  TData = unknown,
  TError = Error,
  TQueryFnData = TData,
  TQueryKey extends readonly unknown[] = readonly unknown[]
> extends Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, 'retry' | 'retryDelay'> {
  /** Retry configuration for this query */
  retryConfig?: QueryRetryConfig
}

/**
 * Extended mutation options with retry configuration
 */
export interface ExtendedMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void
> extends Omit<UseMutationOptions<TData, TError, TVariables>, 'retry' | 'retryDelay'> {
  /** Retry configuration for this mutation */
  retryConfig?: QueryRetryConfig
}

/**
 * Standard API error format
 */
export interface ApiError {
  status: number
  message: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * Paginated query response structure
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Query cache invalidation pattern
 */
export interface CacheInvalidationOptions {
  /** Query keys to invalidate */
  queryKeys?: (readonly unknown[])[]
  /** Whether to refetch queries immediately */
  refetch?: boolean
}
