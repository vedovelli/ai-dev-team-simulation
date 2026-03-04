import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { createCacheInvalidationManager } from '../cacheInvalidation'

describe('CacheInvalidationManager', () => {
  let queryClient: QueryClient
  let manager: ReturnType<typeof createCacheInvalidationManager>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    manager = createCacheInvalidationManager(queryClient)
  })

  it('should invalidate single query', async () => {
    const queryKey = ['users', '1']
    queryClient.setQueryData(queryKey, { id: '1', name: 'John' })

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await manager.invalidateQuery(queryKey)

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey })
  })

  it('should invalidate multiple queries', async () => {
    const keys = [['users', '1'], ['users', '2'], ['posts', '1']]
    keys.forEach((key) => queryClient.setQueryData(key, { test: 'data' }))

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await manager.invalidateQueries(keys as any)

    expect(invalidateSpy).toHaveBeenCalledTimes(3)
  })

  it('should invalidate queries by prefix', async () => {
    queryClient.setQueryData(['users', '1'], { id: '1' })
    queryClient.setQueryData(['users', '2'], { id: '2' })
    queryClient.setQueryData(['posts', '1'], { id: '1' })

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await manager.invalidateQueriesByPrefix('users')

    expect(invalidateSpy).toHaveBeenCalled()
    const call = invalidateSpy.mock.calls[0][0]
    expect(call).toHaveProperty('predicate')
  })

  it('should refetch query', async () => {
    const queryKey = ['data']
    queryClient.setQueryData(queryKey, { value: 'test' })

    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries')

    await manager.refetchQuery(queryKey)

    expect(refetchSpy).toHaveBeenCalledWith({ queryKey })
  })

  it('should remove query from cache', () => {
    const queryKey = ['temp']
    queryClient.setQueryData(queryKey, { temp: 'data' })

    expect(queryClient.getQueryData(queryKey)).toBeDefined()

    manager.removeQuery(queryKey)

    expect(queryClient.getQueryData(queryKey)).toBeUndefined()
  })

  it('should clear all cache', () => {
    queryClient.setQueryData(['users'], [])
    queryClient.setQueryData(['posts'], [])

    const clearSpy = vi.spyOn(queryClient, 'clear')

    manager.clearCache()

    expect(clearSpy).toHaveBeenCalled()
  })

  it('should set query data directly', () => {
    const queryKey = ['direct']
    const data = { id: '1', name: 'Test' }

    manager.setQueryData(queryKey, data)

    expect(queryClient.getQueryData(queryKey)).toEqual(data)
  })

  it('should get query data', () => {
    const queryKey = ['retrieve']
    const data = { test: 'value' }
    queryClient.setQueryData(queryKey, data)

    const result = manager.getQueryData(queryKey)

    expect(result).toEqual(data)
  })

  it('should return undefined for non-existent query', () => {
    const result = manager.getQueryData(['non', 'existent'])

    expect(result).toBeUndefined()
  })
})
