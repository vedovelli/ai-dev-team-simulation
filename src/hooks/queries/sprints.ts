import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type {
  Sprint,
  SprintTask,
  BurndownDataPoint,
  TeamCapacity,
} from '../../types/sprint'

/**
 * Query keys factory for sprint queries.
 * Follows TanStack Query best practices for organizing cache keys.
 * @see https://tanstack.com/query/latest/docs/react/important-defaults
 */
export const sprintKeys = {
  all: ['sprints'] as const,
  lists: () => [...sprintKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...sprintKeys.lists(), { ...filters }] as const,
  details: () => [...sprintKeys.all, 'detail'] as const,
  detail: (id: string) => [...sprintKeys.details(), id] as const,
  tasks: () => [...sprintKeys.all, 'tasks'] as const,
  taskList: (sprintId: string) => [...sprintKeys.tasks(), sprintId] as const,
  burndown: () => [...sprintKeys.all, 'burndown'] as const,
  burndownData: (sprintId: string) =>
    [...sprintKeys.burndown(), sprintId] as const,
  capacity: () => [...sprintKeys.all, 'capacity'] as const,
  capacityData: (sprintId: string) =>
    [...sprintKeys.capacity(), sprintId] as const,
}

interface SprintsListResponse {
  data: Sprint[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Fetch all sprints with pagination support and optional filtering by status.
 * Implements stale-while-revalidate pattern with 5-minute stale time.
 * Automatically refetches on window focus.
 *
 * @param page - Page number (1-indexed, defaults to 1)
 * @param pageSize - Number of items per page (defaults to 10)
 * @param status - Filter by sprint status (optional)
 * @returns Sprints array with pagination metadata
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSprints(1, 10, 'active')
 * ```
 */
export function useSprints(
  page: number = 1,
  pageSize: number = 10,
  status?: string
) {
  return useQuery<SprintsListResponse>({
    queryKey: sprintKeys.list({ page, pageSize, status }),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (status) {
        params.append('status', status)
      }

      const response = await fetch(`/api/sprints?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch sprints')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (stale-while-revalidate)
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    retry: 2,
  })
}

/**
 * Fetch a single sprint by ID with its details.
 * Enables dependent queries - only fetches if sprintId is provided.
 *
 * @param sprintId - The sprint ID to fetch (can be null/undefined)
 * @returns Single Sprint object with loading and error states
 *
 * @example
 * ```tsx
 * const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
 * const { data: sprint } = useSprintDetails(selectedSprintId)
 * // Only fetches when selectedSprintId is set
 * ```
 */
export function useSprintDetails(sprintId: string | null | undefined) {
  return useQuery<Sprint>({
    queryKey: sprintKeys.detail(sprintId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch sprint ${sprintId}`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!sprintId, // Dependent query - only runs when sprintId is provided
  })
}

/**
 * Fetch tasks for a specific sprint.
 * Dependent query - only fetches when sprintId is provided.
 * Works in tandem with useSprintDetails for coordinated data fetching.
 *
 * @param sprintId - The sprint ID (can be null/undefined)
 * @returns Array of SprintTask objects
 *
 * @example
 * ```tsx
 * const { data: sprint } = useSprintDetails(sprintId)
 * const { data: tasks } = useSprintTasks(sprintId)
 * // Both queries coordinate automatically
 * ```
 */
export function useSprintTasks(sprintId: string | null | undefined) {
  return useQuery<SprintTask[]>({
    queryKey: sprintKeys.taskList(sprintId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/tasks`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks for sprint ${sprintId}`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 3, // 3 minutes (tasks might change more frequently)
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!sprintId, // Dependent query
  })
}

/**
 * Fetch burndown data for a sprint with automatic refetching.
 * Uses refetchInterval to keep burndown chart up-to-date with "real-time" feel.
 *
 * Cache invalidation patterns (following FAB-60 guide):
 * - Use `queryClient.invalidateQueries` when tasks change
 * - Cancel ongoing refetch when sprint status changes to 'completed'
 *
 * @param sprintId - The sprint ID (can be null/undefined)
 * @returns Array of BurndownDataPoint objects with day/ideal/actual metrics
 *
 * @example
 * ```tsx
 * const { data: burndownData } = useBurndownData(sprintId)
 * // Automatically refetches every 30 seconds while sprint is active
 * ```
 */
export function useBurndownData(sprintId: string | null | undefined) {
  return useQuery<BurndownDataPoint[]>({
    queryKey: sprintKeys.burndownData(sprintId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/burndown`)
      if (!response.ok) {
        throw new Error(`Failed to fetch burndown data for sprint ${sprintId}`)
      }
      return response.json()
    },
    staleTime: 1000 * 30, // 30 seconds (burndown should feel fresh)
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 30, // Auto-refetch every 30 seconds for "real-time" feel
    retry: 2,
    enabled: !!sprintId, // Dependent query
  })
}

/**
 * Fetch team capacity allocation data for a sprint.
 * Shows which team members are allocated to the sprint and their utilization.
 *
 * @param sprintId - The sprint ID (can be null/undefined)
 * @returns TeamCapacity object with member allocation and utilization metrics
 *
 * @example
 * ```tsx
 * const { data: capacity } = useTeamCapacity(sprintId)
 * if (capacity) {
 *   console.log(`Available capacity: ${capacity.availableCapacity} points`)
 * }
 * ```
 */
export function useTeamCapacity(sprintId: string | null | undefined) {
  return useQuery<TeamCapacity>({
    queryKey: sprintKeys.capacityData(sprintId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/capacity`)
      if (!response.ok) {
        throw new Error(`Failed to fetch capacity data for sprint ${sprintId}`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (capacity changes less frequently)
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!sprintId, // Dependent query
  })
}
