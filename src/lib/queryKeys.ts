/**
 * Query Key Factory Pattern
 *
 * Centralized management of query keys to ensure consistency
 * and make cache invalidation predictable.
 *
 * This pattern helps with:
 * - Type-safe query key creation
 * - Consistent key structure across the app
 * - Easy cache invalidation based on key hierarchy
 *
 * @example
 * // Using query keys
 * const { data } = useQuery({
 *   queryKey: queryKeys.tasks.list(),
 *   queryFn: fetchTasks,
 * })
 *
 * // Invalidating cache
 * queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
 */

export const queryKeys = {
  all: [''] as const,

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: { status?: string; priority?: string }) =>
      [...queryKeys.tasks.lists(), { filters }] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.tasks.details(), id] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: { role?: string }) =>
      [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.users.details(), id] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: { status?: string }) =>
      [...queryKeys.projects.lists(), { filters }] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.projects.details(), id] as const,
  },
} as const
