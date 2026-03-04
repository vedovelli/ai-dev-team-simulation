import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQueryWithRetry } from '../queries/useQueryWithRetry'
import React from 'react'

describe('useQueryWithRetry', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable default retry for testing
        },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' }
    const queryFn = vi.fn(async () => mockData)

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['data'],
          queryFn,
          retryConfig: { maxRetries: 3 },
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.isRecoverable).toBe(true)
  })

  it('should have manual retry function', () => {
    const queryFn = vi.fn(async () => ({ id: 1 }))

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['data'],
          queryFn,
          retryConfig: { maxRetries: 3 },
        }),
      { wrapper }
    )

    expect(result.current.manualRetry).toBeDefined()
    expect(typeof result.current.manualRetry).toBe('function')
  })

  it('should respect maxRetries limit', async () => {
    const queryFn = vi.fn(async () => {
      throw new Error('Network error')
    })

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['data'],
          queryFn,
          retryConfig: {
            maxRetries: 2,
            initialDelayMs: 1,
            maxDelayMs: 10,
          },
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    }, { timeout: 1000 })

    // Should not exceed maxRetries + 1 (initial attempt)
    expect(queryFn.mock.calls.length).toBeLessThanOrEqual(3)
  })
})
