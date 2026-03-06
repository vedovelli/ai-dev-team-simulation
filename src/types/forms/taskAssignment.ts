import { z } from 'zod'

export const taskAssignmentSchema = z.object({
  agent: z.string().min(1, 'Agent is required').describe('Agent ID'),
  priority: z.number().min(1).max(4).describe('Priority level 1-4'),
  estimatedHours: z.number().min(0).optional().describe('Estimated hours'),
})

export type TaskAssignmentInput = z.infer<typeof taskAssignmentSchema>
