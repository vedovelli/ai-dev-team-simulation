/**
 * Tests for useResilientQuery hook
 *
 * Tests cover:
 * - Successful queries without retries
 * - Failed queries with exponential backoff retries
 * - Circuit breaker activation after threshold
 * - Manual retry functionality
 * - Callback invocation on success/error
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useResilientQuery } from '../useResilientQuery'

/**
 * Create a wrapper for the hook with QueryClient provider
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useResilientQuery', () => {
  beforeEach(() => {
    // Clear any stored circuit breaker states between tests
    jest.clearAllMocks()
  })

  it('should successfully fetch data without retries', async () => {
    const mockData = { id: 1, name: 'Test User' }
    const queryFn = jest.fn().mockResolvedValue(mockData)
    const onSuccess = jest.fn()

    const { result } = renderHook(
      () =>
        useResilientQuery({
          queryKey: ['user', 1],
          queryFn,
          onSuccess,
        }),
      { wrapper: createWrapper() },
    )

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Wait for success
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.isError).toBe(false)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(mockData)
  })

  it('should retry with exponential backoff on failure', async () => {
    const error = new Error('Network error')
    const queryFn = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ id: 1, name: 'Test User' })

    const { result } = renderHook(
      () =>
        useResilientQuery({
          queryKey: ['user', 2],
          queryFn,
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 100,
            maxDelay: 1000,
            circuitBreakerThreshold: 5,
          },
        }),
      { wrapper: createWrapper() },
    )

    // Wait for all retries to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should have retried twice and succeeded on third attempt
    expect(queryFn).toHaveBeenCalledTimes(3)
    expect(result.current.data).toEqual({ id: 1, name: 'Test User' })
    expect(result.current.isError).toBe(false)
  })

  it('should fail fast when circuit breaker is open', async () => {
    const error = new Error('Service unavailable')
    const queryFn = jest.fn().mockRejectedValue(error)

    const { result, rerender } = renderHook(
      () =>
        useResilientQuery({
          queryKey: ['user', 3],
          queryFn,
          retryConfig: {
            maxAttempts: 2,
            baseDelay: 100,
            maxDelay: 1000,
            circuitBreakerThreshold: 3,
          },
        }),
      { wrapper: createWrapper() },
    )

    // Trigger multiple failures to trip circuit breaker
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // After 3 failures, circuit breaker should be open
    expect(result.current.isCircuitBreakerOpen).toBe(true)

    // Reset mock call count
    queryFn.mockClear()

    // Try again - should fail fast without calling queryFn
    rerender()

    await waitFor(() => {
      expect(result.current.isCircuitBreakerOpen).toBe(true)
    })

    // Should not have called queryFn on circuit breaker open
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  it('should support manual retry', async () => {
    const mockData = { id: 1, name: 'Test User' }
    const queryFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValueOnce(mockData)

    const { result } = renderHook(
      () =>
        useResilientQuery({
          queryKey: ['user', 4],
          queryFn,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            circuitBreakerThreshold: 5,
          },
        }),
      { wrapper: createWrapper() },
    )

    // Wait for initial error
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(queryFn).toHaveBeenCalledTimes(1)

    // Manually retry
    act(() => {
      result.current.retry()
    })

    // Wait for success
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.isError).toBe(false)
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should invoke onError callback on permanent failure', async () => {
    const error = new Error('Permanent error')
    const queryFn = jest.fn().mockRejectedValue(error)
    const onError = jest.fn()

    const { result } = renderHook(
      () =>
        useResilientQuery({
          queryKey: ['user', 5],
          queryFn,
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 100,
            maxDelay: 1000,
            circuitBreakerThreshold: 3,
          },
          onError,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should track retry attempts', async () => {
    const error = new Error('Retry test error')
    const queryFn = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ id: 1 })

    const { result } = renderHook(
      () =>
        useResilientQuery({
          queryKey: ['user', 6],
          queryFn,
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 50,
            maxDelay: 1000,
            circuitBreakerThreshold: 5,
          },
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // After success, retry attempt should be reset
    expect(result.current.retryAttempt).toBe(0)
  })
})
