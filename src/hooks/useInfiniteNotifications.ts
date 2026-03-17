import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { Notification } from '../types/notification'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Response format for infinite scroll pagination
 */
interface InfiniteNotificationsResponse {
  data: Notification[]
  hasMore: boolean
  totalCount: number
  nextPage: number | null
}

/**
 * Query key factory for infinite notifications
 */
export const infiniteNotificationsQueryKeys = {
  all: ['notifications', 'infinite'] as const,
  list: () => infiniteNotificationsQueryKeys.all,
}

/**
 * Configuration options for useInfiniteNotifications hook
 */
export interface UseInfiniteNotificationsOptions {
  /** Number of items per page (default: 20) */
  pageSize?: number
}

/**
 * Fetch paginated notifications with infinite scroll support
 *
 * Features:
 * - TanStack Query useInfiniteQuery for pagination
 * - 20-item batches via ?page=1&limit=20 query params
 * - Preserve mark-as-read optimistic updates across pages
 * - Stale time: 30s (inherit from useNotifications)
 * - Virtual list ready (for NotificationCenter component)
 */
export function useInfiniteNotifications(options: UseInfiniteNotificationsOptions = {}) {
  const { pageSize = 20 } = options
  const queryClient = useQueryClient()

  const query = useInfiniteQuery<InfiniteNotificationsResponse, Error>({
    queryKey: infiniteNotificationsQueryKeys.list(),
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      params.append('page', String(pageParam))
      params.append('limit', String(pageSize))

      const response = await fetch(`/api/notifications?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }

      return response.json() as Promise<InfiniteNotificationsResponse>
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Mutation for marking a notification as read (preserves across pages)
  const markAsReadMutation = useMutationWithRetry<Notification, { id: string }>({
    mutationFn: async ({ id }) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`)
      }

      return response.json() as Promise<Notification>
    },
    onMutate: async ({ id }) => {
      // Cancel any pending requests for notifications
      await queryClient.cancelQueries({ queryKey: infiniteNotificationsQueryKeys.list() })

      // Snapshot previous data across all pages
      const previousData = queryClient.getQueryData<{ pages: InfiniteNotificationsResponse[] }>(
        { queryKey: infiniteNotificationsQueryKeys.list() }
      )

      // Optimistically update notification cache across all pages
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            data: page.data.map((notif) =>
              notif.id === id ? { ...notif, read: true } : notif
            ),
          })),
        }
        queryClient.setQueryData(infiniteNotificationsQueryKeys.list(), updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(infiniteNotificationsQueryKeys.list(), context.previousData)
      }
    },
  })

  /**
   * Mark a single notification as read
   */
  const markAsRead = (id: string) => {
    markAsReadMutation.mutate({ id })
  }

  // Flatten all notifications from all pages
  const allNotifications = query.data?.pages.flatMap((page) => page.data) ?? []

  // Compute total count from first page
  const totalCount = query.data?.pages[0]?.totalCount ?? 0

  return {
    // Query state
    ...query,

    // Computed values
    notifications: allNotifications,
    totalCount,

    // Mutation state
    markAsReadLoading: markAsReadMutation.isLoading,
    markAsReadError: markAsReadMutation.error,

    // Actions
    markAsRead,
  }
}

export type UseInfiniteNotificationsReturn = ReturnType<typeof useInfiniteNotifications>
