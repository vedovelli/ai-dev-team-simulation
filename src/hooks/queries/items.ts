import { useQuery } from '@tanstack/react-query'
import type { Item } from '../../types/item'

/**
 * Query keys factory for item queries.
 * Follows TanStack Query best practices for organizing cache keys.
 * @see https://tanstack.com/query/latest/docs/react/important-defaults
 */
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...itemKeys.lists(), { ...filters }] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
}

interface ItemsListResponse {
  data: Item[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Fetch all items with pagination support.
 * Implements stale-while-revalidate pattern with 5-minute stale time.
 * Automatically refetches on window focus.
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Items array with loading and error states
 */
export function useItems(page: number = 1, pageSize: number = 10) {
  return useQuery<ItemsListResponse>({
    queryKey: itemKeys.list({ page, pageSize }),
    queryFn: async () => {
      const response = await fetch(`/api/items?page=${page}&pageSize=${pageSize}`)
      if (!response.ok) {
        throw new Error('Failed to fetch items')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (stale-while-revalidate)
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Automatic refetch on window focus
    retry: 2,
  })
}

/**
 * Fetch a single item by ID.
 * @param id - The item ID to fetch
 * @returns Single Item object with loading and error states
 */
export function useItem(id: string) {
  return useQuery<Item>({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/items/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch item ${id}`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!id, // Only run query if id is provided
  })
}
