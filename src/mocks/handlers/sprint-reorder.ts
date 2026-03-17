/**
 * MSW handlers for sprint task reordering
 *
 * Mock API endpoint for bulk reordering operations:
 * - PATCH /api/sprints/:id/tasks/reorder - Reorder tasks within a sprint
 */

import { http, HttpResponse } from 'msw'

interface ReorderPayload {
  taskIds: string[]
}

interface ReorderResponse {
  success: boolean
  sprintId: string
  taskIds: string[]
  message: string
}

/**
 * In-memory store for sprint tasks
 * In production, this would be persisted in the database
 */
const sprintTasksStore: Record<string, string[]> = {
  'sprint-1': ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'],
  'sprint-2': ['task-6', 'task-7', 'task-8', 'task-9', 'task-10', 'task-11'],
  'sprint-3': ['task-12', 'task-13', 'task-14'],
}

export const sprintReorderHandlers = [
  http.patch('/api/sprints/:id/tasks/reorder', async ({ params, request }) => {
    const { id: sprintId } = params
    const payload = (await request.json()) as ReorderPayload

    // Validate that sprint exists
    if (!sprintTasksStore[sprintId as string]) {
      return HttpResponse.json(
        {
          error: 'Sprint not found',
        },
        { status: 404 }
      )
    }

    const currentTaskIds = sprintTasksStore[sprintId as string]

    // Validate that all task IDs belong to this sprint
    const invalidTaskIds = payload.taskIds.filter((id) => !currentTaskIds.includes(id))
    if (invalidTaskIds.length > 0) {
      return HttpResponse.json(
        {
          error: `Invalid task IDs for this sprint: ${invalidTaskIds.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate that the number of task IDs matches
    if (payload.taskIds.length !== currentTaskIds.length) {
      return HttpResponse.json(
        {
          error: 'Reorder payload must include all tasks in the sprint',
        },
        { status: 400 }
      )
    }

    // Add a small delay to simulate network latency (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Update the store with the new order
    sprintTasksStore[sprintId as string] = payload.taskIds

    return HttpResponse.json<ReorderResponse>({
      success: true,
      sprintId: sprintId as string,
      taskIds: payload.taskIds,
      message: 'Tasks reordered successfully',
    })
  }),
]
