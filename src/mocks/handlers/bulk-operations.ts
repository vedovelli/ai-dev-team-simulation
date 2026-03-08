import { http, HttpResponse } from 'msw'
import type { Task, UpdateTaskInput } from '../../types/task'

interface BulkUpdatePayload {
  agentIds: string[]
  updates: Record<string, unknown>
}

interface BulkAssignPayload {
  agentIds: string[]
  task: {
    id: string
    name: string
  }
}

interface BulkUpdateTasksPayload {
  taskIds: string[]
  updates: UpdateTaskInput
}

interface BulkUpdateTasksResponse {
  success: boolean
  results: Array<{
    taskId: string
    success: boolean
    error?: string
    task?: Task
  }>
  successCount: number
  failureCount: number
}

export const bulkOperationHandlers = [
  http.post('/api/agents/bulk-update', async ({ request }) => {
    const payload = (await request.json()) as BulkUpdatePayload

    // Simulate partial failure scenario (20% fail)
    const failureThreshold = Math.random()
    if (failureThreshold < 0.2) {
      return HttpResponse.json(
        {
          error: 'Failed to update some agents',
          failedAgents: payload.agentIds.slice(0, Math.ceil(payload.agentIds.length * 0.3)),
          successCount: payload.agentIds.length - Math.ceil(payload.agentIds.length * 0.3),
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      success: true,
      updatedCount: payload.agentIds.length,
      updates: payload.updates,
    })
  }),

  http.post('/api/agents/bulk-assign', async ({ request }) => {
    const payload = (await request.json()) as BulkAssignPayload

    // Simulate partial failure scenario (20% fail)
    const failureThreshold = Math.random()
    if (failureThreshold < 0.2) {
      return HttpResponse.json(
        {
          error: 'Failed to assign task to some agents',
          failedAgents: payload.agentIds.slice(0, Math.ceil(payload.agentIds.length * 0.3)),
          successCount: payload.agentIds.length - Math.ceil(payload.agentIds.length * 0.3),
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      success: true,
      assignedCount: payload.agentIds.length,
      task: payload.task,
    })
  }),

  // Task bulk update endpoint
  http.patch('/api/tasks/bulk', async ({ request }) => {
    const payload = (await request.json()) as BulkUpdateTasksPayload

    // Simulate 10% chance of partial failure for realistic UX
    const hasPartialFailure = Math.random() < 0.1
    const failureIndexes = new Set<number>()

    if (hasPartialFailure) {
      // 20-30% of tasks fail
      const failureCount = Math.ceil(payload.taskIds.length * (0.2 + Math.random() * 0.1))
      for (let i = 0; i < failureCount; i++) {
        failureIndexes.add(Math.floor(Math.random() * payload.taskIds.length))
      }
    }

    const results = payload.taskIds.map((taskId, index) => {
      if (failureIndexes.has(index)) {
        return {
          taskId,
          success: false,
          error: 'Failed to update task. Please try again.',
        }
      }

      // Mock task response with updates applied
      const updatedTask: Task = {
        id: taskId,
        title: `Task ${taskId.slice(0, 4)}`,
        assignee: payload.updates.assignee || 'Unknown',
        team: 'Team A',
        status: payload.updates.status || 'backlog',
        priority: payload.updates.priority || 'medium',
        storyPoints: 5,
        sprint: 'sprint-1',
        order: index,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return {
        taskId,
        success: true,
        task: updatedTask,
      }
    })

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return HttpResponse.json<BulkUpdateTasksResponse>({
      success: failureCount === 0,
      results,
      successCount,
      failureCount,
    })
  }),
]
