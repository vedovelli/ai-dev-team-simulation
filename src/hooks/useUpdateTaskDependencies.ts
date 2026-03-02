import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task } from '../types/task'

interface UpdateDependenciesPayload {
  id: string
  dependsOn: string[]
}

async function updateTaskDependencies(payload: UpdateDependenciesPayload): Promise<Task> {
  const response = await fetch(`/api/tasks/${payload.id}/dependencies`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dependsOn: payload.dependsOn }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update task dependencies')
  }

  return response.json()
}

export function useUpdateTaskDependencies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTaskDependencies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
