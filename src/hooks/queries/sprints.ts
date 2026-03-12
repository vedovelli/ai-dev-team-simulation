import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type {
  Sprint,
  SprintTask,
  BurndownDataPoint,
  TeamCapacity,
  SprintReport,
  SprintReportRequest,
  SprintHistoryEvent,
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
  reports: () => [...sprintKeys.all, 'report'] as const,
  report: (sprintId: string, filters?: Record<string, unknown>) =>
    [...sprintKeys.reports(), sprintId, { ...filters }] as const,
  history: () => [...sprintKeys.all, 'history'] as const,
  historyData: (sprintId: string) =>
    [...sprintKeys.history(), sprintId] as const,
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
    queryKey: sprintId ? sprintKeys.detail(sprintId) : [],
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
    queryKey: sprintId ? sprintKeys.taskList(sprintId) : [],
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
 * - Pass sprintStatus to disable refetching when sprint is completed
 *
 * @param sprintId - The sprint ID (can be null/undefined)
 * @param sprintStatus - The sprint status ('active', 'completed', etc). Disables refetching when not 'active'
 * @returns Array of BurndownDataPoint objects with day/ideal/actual metrics
 *
 * @example
 * ```tsx
 * const { data: sprint } = useSprintDetails(sprintId)
 * const { data: burndownData } = useBurndownData(sprintId, sprint?.status)
 * // Automatically refetches every 30 seconds while sprint is active
 * // Stops refetching when status changes to 'completed'
 * ```
 */
export function useBurndownData(
  sprintId: string | null | undefined,
  sprintStatus?: string
) {
  return useQuery<BurndownDataPoint[]>({
    queryKey: sprintId ? sprintKeys.burndownData(sprintId) : [],
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
    refetchInterval:
      sprintStatus === 'active' ? 1000 * 30 : false, // Auto-refetch only while active
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
    queryKey: sprintId ? sprintKeys.capacityData(sprintId) : [],
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

/**
 * Fetch sprint performance report with historical metrics and trends.
 * Aggregates metrics data over a date range for reports and analysis.
 * Uses 1-hour stale time as business reports don't change frequently.
 *
 * @param sprintId - The sprint ID (can be null/undefined)
 * @param filters - Report filters including startDate and endDate (ISO 8601 format)
 * @returns SprintReport object with trends, aggregations, and raw data points
 *
 * @example
 * ```tsx
 * const { data: report, isLoading } = useSprintReport(sprintId, {
 *   startDate: '2026-02-15',
 *   endDate: '2026-02-28',
 * })
 * ```
 */
export function useSprintReport(
  sprintId: string | null | undefined,
  filters?: Record<string, unknown>
) {
  return useQuery<SprintReport>({
    queryKey: sprintId ? sprintKeys.report(sprintId, filters) : [],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.startDate) {
        params.append('startDate', String(filters.startDate))
      }
      if (filters?.endDate) {
        params.append('endDate', String(filters.endDate))
      }

      const response = await fetch(
        `/api/sprints/${sprintId}/report?${params.toString()}`
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch report for sprint ${sprintId}`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 60, // 1 hour (business reports don't change often)
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!sprintId, // Dependent query
  })
}

/**
 * Fetch sprint lifecycle history events.
 * Shows chronological view of sprint state changes (created, started, completed, archived, restored).
 *
 * @param sprintId - The sprint ID (can be null/undefined)
 * @returns Array of SprintHistoryEvent objects ordered chronologically
 *
 * @example
 * ```tsx
 * const { data: history } = useSprintHistory(sprintId)
 * // Returns [{ eventType: 'created', ... }, { eventType: 'started', ... }, ...]
 * ```
 */
export function useSprintHistory(sprintId: string | null | undefined) {
  return useQuery<SprintHistoryEvent[]>({
    queryKey: sprintId ? sprintKeys.historyData(sprintId) : [],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/history`)
      if (!response.ok) {
        throw new Error(`Failed to fetch history for sprint ${sprintId}`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!sprintId, // Dependent query
  })
}
