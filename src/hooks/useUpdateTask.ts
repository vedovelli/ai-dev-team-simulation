import { useQueryClient } from '@tanstack/react-query'
import type { Task, UpdateTaskInput } from '../types/task'
import type { Notification } from '../types/notification'
import { useConflictAwareMutation } from './useConflictAwareMutation'

/**
 * Configuration options for useUpdateTask hook
 */
export interface UseUpdateTaskOptions {
  /**
   * Callback when task update succeeds
   * @param data - The updated task
   * @param messageOverride - Optional custom message to emit instead of default
   */
  onSuccess?: (data: Task, messageOverride?: string) => void

  /**
   * Callback when task update fails
   * @param error - The error that occurred
   * @param messageOverride - Optional custom message to emit instead of default
   */
  onError?: (error: Error, messageOverride?: string) => void
}

/**
 * Helper to inject a transient notification into the cache and auto-expire after 5 seconds
 */
function injectTransientNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  notification: Notification
): void {
  // Inject notification into the infinite query cache
  queryClient.setQueryData(
    ['notifications', { unreadOnly: false }],
    (oldData: any) => {
      if (!oldData?.pages) {
        return oldData
      }

      return {
        ...oldData,
        pages: [
          {
            ...oldData.pages[0],
            items: [notification, ...(oldData.pages[0]?.items ?? [])],
            unreadCount: (oldData.pages[0]?.unreadCount ?? 0) + (notification.read ? 0 : 1),
          },
          ...(oldData.pages.slice(1) ?? []),
        ],
      }
    }
  )

  // Auto-expire (remove) the notification after 5 seconds
  setTimeout(() => {
    queryClient.setQueryData(
      ['notifications', { unreadOnly: false }],
      (oldData: any) => {
        if (!oldData?.pages) {
          return oldData
        }

        const wasUnread = !notification.read

        return {
          ...oldData,
          pages: oldData.pages.map((page: any, pageIndex: number) => {
            if (pageIndex === 0) {
              return {
                ...page,
                items: page.items.filter((n: Notification) => n.id !== notification.id),
                unreadCount: wasUnread ? Math.max(0, page.unreadCount - 1) : page.unreadCount,
              }
            }
            return page
          }),
        }
      }
    )
  }, 5000)
}

export function useUpdateTask(options: UseUpdateTaskOptions = {}) {
  const queryClient = useQueryClient()

  return useConflictAwareMutation({
    mutationFn: async ({ id, data, version }: { id: string; data: UpdateTaskInput; version: number }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, version }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 409) {
          throw new Error(`409: conflict with serverVersion: ${JSON.stringify(error.serverVersion || {})}`)
        }
        throw new Error(error.error || 'Failed to update task')
      }

      return response.json() as Promise<Task>
    },
    queryKeyFn: ({ id }) => ['tasks', id],
    onMutate: async ({ id, data, version }) => {
      // Cancel any pending requests for tasks
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous tasks data
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      // Optimistically update all task queries
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldTasks: Task[] = []) =>
          oldTasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...data,
                  version: version + 1,
                  updatedAt: new Date().toISOString(),
                }
              : task
          )
        )
      })

      return { previousTasks }
    },
    onError: (error, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }

      // Emit error notification
      const errorNotification: Notification = {
        id: `error-${Date.now()}-${Math.random()}`,
        type: 'task_reassigned',
        message: options.onError?.toString().includes('messageOverride') ? '' : 'Failed to update task',
        timestamp: new Date().toISOString(),
        read: true,
        priority: 'high',
        metadata: {
          entityType: 'task',
          source: 'task-mutation',
        },
      }

      injectTransientNotification(queryClient, errorNotification)

      // Call user callback if provided
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)))
      }
    },
    onSuccess: (data) => {
      // Emit success notification
      const successNotification: Notification = {
        id: `success-${Date.now()}-${Math.random()}`,
        type: 'task_reassigned',
        message: 'Task updated',
        timestamp: new Date().toISOString(),
        read: true,
        priority: 'normal',
        metadata: {
          entityId: data.id,
          entityType: 'task',
          source: 'task-mutation',
        },
      }

      injectTransientNotification(queryClient, successNotification)

      // Call user callback if provided
      if (options.onSuccess) {
        options.onSuccess(data)
      }

      // Refetch tasks to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      // Invalidate activity feed since task state changed
      queryClient.invalidateQueries({ queryKey: ['activity', 'feed'] })
    },
  })
}
