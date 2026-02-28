import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface Task {
  title: string
  assignee: string
  storyPoints: number
}

export interface CreateSprintInput {
  name: string
  goals: string
  tasks: Task[]
  estimatedPoints: number
}

export interface Sprint extends CreateSprintInput {
  id: string
  createdAt: string
}

export const useCreateSprint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSprintInput) => {
      const response = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create sprint')
      }

      return response.json() as Promise<Sprint>
    },
    onSuccess: (newSprint) => {
      // Optimistic update: add the new sprint to the cache
      queryClient.setQueryData(['sprints'], (oldData: Sprint[] = []) => [
        ...oldData,
        newSprint,
      ])
    },
  })
}
