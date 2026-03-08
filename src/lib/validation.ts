import { z } from 'zod'

// Common validation schemas
export const createTaskRequestSchema = z.object({
  name: z
    .string()
    .min(3, 'Task name must be at least 3 characters')
    .max(255, 'Task name must not exceed 255 characters'),
  status: z.enum(['backlog', 'in-progress', 'in-review', 'done']),
  team: z.string().min(1, 'Team is required'),
  sprint: z.string().min(1, 'Sprint is required'),
  priority: z.enum(['low', 'medium', 'high']),
  estimatedHours: z.number().nonnegative('Estimated hours must be positive').optional(),
  assignedAgent: z.string().default(''),
})

export const createTaskResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  assignee: z.string(),
  team: z.string(),
  status: z.enum(['backlog', 'in-progress', 'in-review', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  storyPoints: z.number(),
  sprint: z.string(),
  order: z.number(),
  estimatedHours: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  dependsOn: z.array(z.string()).optional(),
})

export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>
export type CreateTaskResponse = z.infer<typeof createTaskResponseSchema>

// Export as CreateTaskInput for consistency with form usage
export type CreateTaskInput = CreateTaskRequest

// Batch task assignment validation schema
export const batchTaskAssignmentSchema = z.object({
  taskIds: z
    .array(z.string().min(1))
    .min(1, 'At least one task must be selected'),
  agentId: z.string().min(1, 'Agent is required'),
  priority: z.number().min(1).max(3),
  estimatedHours: z.number().min(0).optional(),
})

export type BatchTaskAssignmentInput = z.infer<typeof batchTaskAssignmentSchema>

// Agent settings validation schema
export const agentSettingsSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  taskPriorityFilter: z.enum(['all', 'high', 'medium', 'low']),
  autoAssignmentEnabled: z.boolean(),
  maxConcurrentTasks: z
    .number()
    .min(1, 'Must be at least 1')
    .max(10, 'Cannot exceed 10 tasks'),
  notificationPreferences: z.object({
    onTaskAssigned: z.boolean(),
    onTaskCompleted: z.boolean(),
    dailyDigest: z.boolean(),
  }),
})
  .refine(
    (data) => {
      // At least one notification preference must be enabled
      const prefs = data.notificationPreferences
      return prefs.onTaskAssigned || prefs.onTaskCompleted || prefs.dailyDigest
    },
    {
      message: 'At least one notification preference must be enabled',
      path: ['notificationPreferences'],
    }
  )
  .refine(
    (data) => {
      // If auto-assignment enabled, maxConcurrentTasks must be set
      if (data.autoAssignmentEnabled && !data.maxConcurrentTasks) {
        return false
      }
      return true
    },
    {
      message: 'Max concurrent tasks is required when auto-assignment is enabled',
      path: ['maxConcurrentTasks'],
    }
  )

export type AgentSettings = z.infer<typeof agentSettingsSchema>
