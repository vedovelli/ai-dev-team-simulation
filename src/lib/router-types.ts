import { z } from 'zod'

/**
 * Type-safe route parameter schemas
 * These schemas validate and deserialize URL parameters
 */

export const AgentIdParamSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
})
export type AgentIdParam = z.infer<typeof AgentIdParamSchema>

export const SprintIdParamSchema = z.object({
  id: z.string().min(1, 'Sprint ID is required'),
})
export type SprintIdParam = z.infer<typeof SprintIdParamSchema>

export const TeamIdParamSchema = z.object({
  id: z.string().min(1, 'Team ID is required'),
})
export type TeamIdParam = z.infer<typeof TeamIdParamSchema>

/**
 * Type-safe search parameter schemas
 * These validate and deserialize query string parameters
 */

export const TasksSearchParamSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
  team: z.string().optional(),
  assignee: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})
export type TasksSearchParams = z.infer<typeof TasksSearchParamSchema>

export const AgentsSearchParamSchema = z.object({
  filter: z.string().optional(),
  sort: z.enum(['name', 'status', 'role']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})
export type AgentsSearchParams = z.infer<typeof AgentsSearchParamSchema>

export const SprintsSearchParamSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
  team: z.string().optional(),
  sprint: z.string().optional(),
  assignee: z.string().optional(),
})
export type SprintsSearchParams = z.infer<typeof SprintsSearchParamSchema>

export const AnalyticsSearchParamSchema = z.object({
  sprint: z.string().optional(),
  status: z.string().optional(),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d'),
})
export type AnalyticsSearchParams = z.infer<typeof AnalyticsSearchParamSchema>

/**
 * Serialization functions for search parameters
 * Convert between Zod validated types and URL strings
 */

export const serializeTasksSearchParams = (params: TasksSearchParams): Record<string, string> => {
  const result: Record<string, string> = {}
  if (params.status) result.status = params.status
  if (params.priority) result.priority = params.priority
  if (params.search) result.search = params.search
  if (params.team) result.team = params.team
  if (params.assignee) result.assignee = params.assignee
  if (params.dateFrom) result.dateFrom = params.dateFrom
  if (params.dateTo) result.dateTo = params.dateTo
  if (params.sortBy) result.sortBy = params.sortBy
  if (params.sortOrder) result.sortOrder = params.sortOrder
  if (params.page) result.page = String(params.page)
  if (params.limit) result.limit = String(params.limit)
  return result
}

export const deserializeTasksSearchParams = (params: Record<string, unknown>): TasksSearchParams => {
  return TasksSearchParamSchema.parse(params)
}

export const serializeAgentsSearchParams = (params: AgentsSearchParams): Record<string, string> => {
  const result: Record<string, string> = {}
  if (params.filter) result.filter = params.filter
  if (params.sort) result.sort = params.sort
  if (params.sortOrder) result.sortOrder = params.sortOrder
  return result
}

export const deserializeAgentsSearchParams = (params: Record<string, unknown>): AgentsSearchParams => {
  return AgentsSearchParamSchema.parse(params)
}

export const serializeSprintsSearchParams = (params: SprintsSearchParams): Record<string, string> => {
  const result: Record<string, string> = {}
  if (params.status) result.status = params.status
  if (params.priority) result.priority = params.priority
  if (params.search) result.search = params.search
  if (params.team) result.team = params.team
  if (params.sprint) result.sprint = params.sprint
  if (params.assignee) result.assignee = params.assignee
  return result
}

export const deserializeSprintsSearchParams = (params: Record<string, unknown>): SprintsSearchParams => {
  return SprintsSearchParamSchema.parse(params)
}

export const serializeAnalyticsSearchParams = (params: AnalyticsSearchParams): Record<string, string> => {
  const result: Record<string, string> = {}
  if (params.sprint) result.sprint = params.sprint
  if (params.status) result.status = params.status
  if (params.timeRange) result.timeRange = params.timeRange
  return result
}

export const deserializeAnalyticsSearchParams = (params: Record<string, unknown>): AnalyticsSearchParams => {
  return AnalyticsSearchParamSchema.parse(params)
}
