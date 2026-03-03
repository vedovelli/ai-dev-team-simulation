import { useQuery } from '@tanstack/react-query'
import type { User } from '../../types/user'

/**
 * Query keys factory for user queries.
 * Follows TanStack Query best practices for organizing cache keys.
 * @see https://tanstack.com/query/latest/docs/react/important-defaults
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...userKeys.lists(), { ...filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

/**
 * Fetch all users from the API.
 * @returns Array of User objects with loading and error states
 */
export function useUsers() {
  return useQuery<User[]>({
    queryKey: userKeys.list(),
    queryFn: async () => {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 2,
  })
}

/**
 * Fetch a single user by ID.
 * @param id - The user ID to fetch
 * @returns Single User object with loading and error states
 */
export function useUser(id: string) {
  return useQuery<User>({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch user ${id}`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    enabled: !!id, // Only run query if id is provided
  })
}
