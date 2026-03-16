import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import type { Task } from '../types/task'
import type { Notification } from '../types/notification'

/**
 * Assignment result returned from the API
 */
export interface AssignmentResult {
  success: boolean
  data: Task
  message: string
  timestamp: string
}

/**
 * Unassignment result returned from the API
 */
export interface UnassignmentResult {
  success: boolean
  data: Task
  message: string
  timestamp: string
}

/**
 * Error response from assignment operations
 */
export interface AssignmentError {
  success: false
  error: string
  code?: string
  conflictDetails?: {
    agentId: string
    currentTaskCount: number
    maxCapacity: number
  }
}

/**
 * Capacity check response
 */
export interface AgentCapacityInfo {
  agentId: string
  currentTasks: number
  maxTasks: number
  available: boolean
  workload: 'low' | 'medium' | 'high' | 'overloaded'
}

/**
 * Variables for task assignment mutation
 */
export interface AssignTaskVariables {
  taskId: string
  agentId: string
}

/**
 * Variables for task unassignment mutation
 */
export interface UnassignTaskVariables {
  taskId: string
}

/**
 * Options for useTaskAssignment hook
 */
export interface UseTaskAssignmentOptions {
  /**
   * Maximum concurrent tasks allowed per agent
   * @default 10
   */
  maxTasksPerAgent?: number

  /**
   * Whether to check capacity before allowing assignment
   * @default true
   */
  validateCapacity?: boolean

  /**
   * Callback when assignment succeeds
   */
  onAssignSuccess?: (data: AssignmentResult, messageOverride?: string) => void

  /**
   * Callback when assignment fails
   */
  onAssignError?: (error: AssignmentError | Error, messageOverride?: string) => void

  /**
   * Callback when unassignment succeeds
   */
  onUnassignSuccess?: (data: UnassignmentResult, messageOverride?: string) => void

  /**
   * Callback when unassignment fails
   */
  onUnassignError?: (error: AssignmentError | Error, messageOverride?: string) => void
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

/**
 * Hook for task assignment with capacity-aware logic and optimistic updates
 *
 * Features:
 * - Assign tasks to agents with POST `/api/tasks/:id/assign`
 * - Unassign tasks from agents with POST `/api/tasks/:id/unassign`
 * - Respect agent capacity limits (max concurrent tasks)
 * - Optimistic UI updates using TanStack Query
 * - Automatic rollback on assignment failure
 * - Validation before assignment (agent available, task unassigned)
 *
 * Query Integration:
 * - Query key structure: `['tasks', taskId, 'assignment']`
 * - Mutation invalidates task list and agent workload queries
 * - Cache update strategy for instant UI feedback
 *
 * @example
 * ```tsx
 * const { assign, unassign, isPending, isError, error } = useTaskAssignment({
 *   maxTasksPerAgent: 10,
 *   validateCapacity: true,
 *   onAssignSuccess: (data) => toast.success('Task assigned'),
 *   onAssignError: (error) => toast.error(error.error),
 * })
 *
 * // Assign task to agent
 * await assign({ taskId: '1', agentId: 'agent-1' })
 *
 * // Unassign task
 * await unassign({ taskId: '1' })
 * ```
 */
export function useTaskAssignment(options: UseTaskAssignmentOptions = {}) {
  const {
    maxTasksPerAgent = 10,
    validateCapacity = true,
    onAssignSuccess,
    onAssignError,
    onUnassignSuccess,
    onUnassignError,
  } = options

  const queryClient = useQueryClient()

  /**
   * Fetch current task data for optimistic update context
   */
  const getTaskData = (taskId: string) => {
    return queryClient.getQueryData<Task>(['tasks', taskId])
  }

  /**
   * Fetch current task list for cache updates
   */
  const getTaskListData = () => {
    return queryClient.getQueryData<Task[]>(['tasks'])
  }

  /**
   * Invalidate related queries after successful assignment
   */
  const invalidateRelatedQueries = (taskId: string, agentId?: string) => {
    // Invalidate specific task
    queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })

    // Invalidate task list
    queryClient.invalidateQueries({ queryKey: ['tasks'] })

    // Invalidate task assignment query
    queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'assignment'] })

    // Invalidate agent workload if agentId is provided
    if (agentId) {
      queryClient.invalidateQueries({ queryKey: ['agent-workload', agentId] })
      queryClient.invalidateQueries({ queryKey: ['agents', agentId] })
    }

    // Invalidate agent availability
    queryClient.invalidateQueries({ queryKey: ['agents', 'availability'] })
  }

  /**
   * Assign task to agent mutation
   */
  const assignMutation = useMutation<AssignmentResult, AssignmentError | Error, AssignTaskVariables>({
    mutationFn: async ({ taskId, agentId }) => {
      // Pre-request validation
      const task = getTaskData(taskId)
      if (!task && validateCapacity) {
        throw new Error('Task not found in cache')
      }

      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw error as AssignmentError
      }

      return response.json() as Promise<AssignmentResult>
    },

    onMutate: async ({ taskId, agentId }) => {
      // Cancel pending queries
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId] })
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Get current task data
      const previousTask = getTaskData(taskId)
      const previousTaskList = getTaskListData()

      // Optimistic update: update the task
      if (previousTask) {
        const optimisticTask: Task = {
          ...previousTask,
          assignee: agentId,
          updatedAt: new Date().toISOString(),
        }
        queryClient.setQueryData(['tasks', taskId], optimisticTask)

        // Optimistic update: update task list
        if (previousTaskList) {
          const updatedList = previousTaskList.map((t) =>
            t.id === taskId ? optimisticTask : t
          )
          queryClient.setQueryData(['tasks'], updatedList)
        }
      }

      return {
        previousTask,
        previousTaskList,
      }
    },

    onSuccess: (data, { taskId, agentId }) => {
      // Set the final server data
      queryClient.setQueryData(['tasks', taskId], data.data)

      // Update task list
      const taskList = getTaskListData()
      if (taskList) {
        const updatedList = taskList.map((t) =>
          t.id === taskId ? data.data : t
        )
        queryClient.setQueryData(['tasks'], updatedList)
      }

      // Invalidate related queries for consistency
      invalidateRelatedQueries(taskId, agentId)

      // Emit success notification
      const successNotification: Notification = {
        id: `success-${Date.now()}-${Math.random()}`,
        type: 'assignment_changed',
        message: `Task assigned to agent`,
        timestamp: new Date().toISOString(),
        read: true,
        priority: 'normal',
        metadata: {
          entityId: taskId,
          entityType: 'task',
          actor: agentId,
          source: 'task-assignment',
        },
      }

      injectTransientNotification(queryClient, successNotification)

      onAssignSuccess?.(data)
    },

    onError: (error, { taskId }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(['tasks', taskId], context.previousTask)
      }
      if (context?.previousTaskList) {
        queryClient.setQueryData(['tasks'], context.previousTaskList)
      }

      // Emit error notification
      const errorMessage =
        error instanceof Error && error.message.includes('capacity')
          ? 'Agent capacity limit reached'
          : 'Failed to assign task'

      const errorNotification: Notification = {
        id: `error-${Date.now()}-${Math.random()}`,
        type: 'assignment_changed',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        read: true,
        priority: 'high',
        metadata: {
          entityId: taskId,
          entityType: 'task',
          source: 'task-assignment',
        },
      }

      injectTransientNotification(queryClient, errorNotification)

      onAssignError?.(error)
    },
  })

  /**
   * Unassign task from agent mutation
   */
  const unassignMutation = useMutation<UnassignmentResult, AssignmentError | Error, UnassignTaskVariables>({
    mutationFn: async ({ taskId }) => {
      const response = await fetch(`/api/tasks/${taskId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw error as AssignmentError
      }

      return response.json() as Promise<UnassignmentResult>
    },

    onMutate: async ({ taskId }) => {
      // Cancel pending queries
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId] })
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Get current data
      const previousTask = getTaskData(taskId)
      const previousTaskList = getTaskListData()
      const previousAgentId = previousTask?.assignee

      // Optimistic update: clear assignee
      if (previousTask) {
        const optimisticTask: Task = {
          ...previousTask,
          assignee: '',
          updatedAt: new Date().toISOString(),
        }
        queryClient.setQueryData(['tasks', taskId], optimisticTask)

        // Optimistic update: update task list
        if (previousTaskList) {
          const updatedList = previousTaskList.map((t) =>
            t.id === taskId ? optimisticTask : t
          )
          queryClient.setQueryData(['tasks'], updatedList)
        }
      }

      return {
        previousTask,
        previousTaskList,
        previousAgentId,
      }
    },

    onSuccess: (data, { taskId }, context) => {
      // Set the final server data
      queryClient.setQueryData(['tasks', taskId], data.data)

      // Update task list
      const taskList = getTaskListData()
      if (taskList) {
        const updatedList = taskList.map((t) =>
          t.id === taskId ? data.data : t
        )
        queryClient.setQueryData(['tasks'], updatedList)
      }

      // Invalidate related queries
      invalidateRelatedQueries(taskId, context?.previousAgentId)

      // Emit success notification
      const successNotification: Notification = {
        id: `success-${Date.now()}-${Math.random()}`,
        type: 'assignment_changed',
        message: 'Task unassigned',
        timestamp: new Date().toISOString(),
        read: true,
        priority: 'normal',
        metadata: {
          entityId: taskId,
          entityType: 'task',
          source: 'task-assignment',
        },
      }

      injectTransientNotification(queryClient, successNotification)

      onUnassignSuccess?.(data)
    },

    onError: (error, { taskId }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(['tasks', taskId], context.previousTask)
      }
      if (context?.previousTaskList) {
        queryClient.setQueryData(['tasks'], context.previousTaskList)
      }

      // Emit error notification
      const errorNotification: Notification = {
        id: `error-${Date.now()}-${Math.random()}`,
        type: 'assignment_changed',
        message: 'Failed to unassign task',
        timestamp: new Date().toISOString(),
        read: true,
        priority: 'high',
        metadata: {
          entityId: taskId,
          entityType: 'task',
          source: 'task-assignment',
        },
      }

      injectTransientNotification(queryClient, errorNotification)

      onUnassignError?.(error)
    },
  })

  /**
   * Helper function to check agent capacity
   */
  const checkAgentCapacity = async (agentId: string): Promise<AgentCapacityInfo> => {
    const response = await fetch('/api/agents/availability')
    if (!response.ok) {
      throw new Error('Failed to check agent capacity')
    }
    const data = await response.json()
    return data.data[agentId] || { agentId, currentTasks: 0, maxTasks: maxTasksPerAgent, available: false, workload: 'overloaded' as const }
  }

  return {
    // Mutations
    assign: assignMutation.mutate,
    assignAsync: assignMutation.mutateAsync,
    unassign: unassignMutation.mutate,
    unassignAsync: unassignMutation.mutateAsync,

    // Assignment state
    assignmentPending: assignMutation.isPending,
    assignmentError: assignMutation.error,

    // Unassignment state
    unassignmentPending: unassignMutation.isPending,
    unassignmentError: unassignMutation.error,

    // Combined state
    isPending: assignMutation.isPending || unassignMutation.isPending,

    // Utility
    checkAgentCapacity,
    maxTasksPerAgent,
  }
}
