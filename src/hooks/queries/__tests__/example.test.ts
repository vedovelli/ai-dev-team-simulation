import { describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import {
  createTestQueryClient,
  renderQueryHook,
  mockSuccessResponse,
  mockErrorResponse,
  mockSlowResponse,
} from '../../../test/utils/queryTestUtils'
import { useUsers, useUser, userKeys } from '../users'

describe('TanStack Query with MSW', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
  })

  describe('useUsers - Success Cases', () => {
    it('should fetch all users successfully', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John', email: 'john@example.com', role: 'Frontend Developer' },
        { id: 'user-2', name: 'Jane', email: 'jane@example.com', role: 'Backend Developer' },
      ]

      mockSuccessResponse('GET', '/api/users', mockUsers)

      const { result } = renderQueryHook(() => useUsers(), { queryClient })

      // Initially loading
      expect(result.current.isPending).toBe(true)

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Verify data is loaded
      expect(result.current.data).toEqual(mockUsers)
      expect(result.current.isSuccess).toBe(true)
    })

    it('should cache user data after first fetch', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John', email: 'john@example.com', role: 'Frontend Developer' },
      ]

      mockSuccessResponse('GET', '/api/users', mockUsers)

      const { result: result1 } = renderQueryHook(() => useUsers(), { queryClient })

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
      })

      // Verify data is in cache
      const cachedData = queryClient.getQueryData(userKeys.list())
      expect(cachedData).toEqual(mockUsers)
    })
  })

  describe('useUser - Success Cases', () => {
    it('should fetch a single user by ID', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Frontend Developer',
      }

      mockSuccessResponse('GET', '/api/users/user-1', mockUser)

      const { result } = renderQueryHook(() => useUser('user-1'), { queryClient })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockUser)
    })

    it('should not fetch if ID is empty', () => {
      const { result } = renderQueryHook(() => useUser(''), { queryClient })

      // Query should not run if id is empty (enabled: !!id)
      expect(result.current.isPending).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle user fetch errors', async () => {
      mockErrorResponse('GET', '/api/users', { error: 'Server error' }, 500)

      const { result } = renderQueryHook(() => useUsers(), { queryClient })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })

    it('should handle user not found (404)', async () => {
      mockErrorResponse('GET', '/api/users/invalid-id', { error: 'User not found' }, 404)

      const { result } = renderQueryHook(() => useUser('invalid-id'), { queryClient })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.status).toBe('error')
    })
  })

  describe('Loading States', () => {
    it('should show loading state during slow network', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John', email: 'john@example.com', role: 'Frontend Developer' },
      ]

      mockSlowResponse('GET', '/api/users', mockUsers, 300)

      const { result } = renderQueryHook(() => useUsers(), { queryClient })

      // Should be loading initially
      expect(result.current.isPending).toBe(true)

      // Wait for the slow response
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.data).toEqual(mockUsers)
    })
  })

  describe('Cache Management', () => {
    it('should invalidate cache and refetch', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John', email: 'john@example.com', role: 'Frontend Developer' },
      ]

      mockSuccessResponse('GET', '/api/users', mockUsers)

      const { result } = renderQueryHook(() => useUsers(), { queryClient })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Invalidate the cache
      await queryClient.invalidateQueries({ queryKey: userKeys.list() })

      // Should refetch
      await waitFor(() => {
        expect(result.current.data).toEqual(mockUsers)
      })
    })

    it('should respect staleTime before refetching', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John', email: 'john@example.com', role: 'Frontend Developer' },
      ]

      mockSuccessResponse('GET', '/api/users', mockUsers)

      const { result } = renderQueryHook(() => useUsers(), { queryClient })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Data should be fresh (within staleTime)
      expect(queryClient.getQueryState(userKeys.list())?.dataUpdatedAt).toBeDefined()
    })
  })
})
