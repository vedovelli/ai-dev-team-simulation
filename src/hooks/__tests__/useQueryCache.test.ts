import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQueryCache } from '../queries/useQueryCache'

describe('useQueryCache', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should invalidate queries by key', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useQueryCache(), { wrapper })

    await act(async () => {
      await result.current.invalidateQueries(['users'])
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['users'],
      exact: false,
      stale: undefined,
    })
  })

  it('should invalidate exact query match', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useQueryCache(), { wrapper })

    await act(async () => {
      await result.current.invalidateExact(['users', 1])
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['users', 1],
      exact: true,
    })
  })

  it('should set query data', () => {
    const setSpy = vi.spyOn(queryClient, 'setQueryData')

    const { result } = renderHook(() => useQueryCache(), { wrapper })

    const testData = [{ id: 1, name: 'Test' }]

    act(() => {
      result.current.setQueryData(['users'], testData)
    })

    expect(setSpy).toHaveBeenCalledWith(['users'], testData)
  })

  it('should remove queries', () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries')

    const { result } = renderHook(() => useQueryCache(), { wrapper })

    act(() => {
      result.current.removeQueries(['users'])
    })

    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: ['users'],
    })
  })
})
