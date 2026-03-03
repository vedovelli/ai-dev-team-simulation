import { useQuery } from '@tanstack/react-query'
import type { Project } from '../../types/project'

/**
 * Query keys factory for project queries.
 * Follows TanStack Query best practices for organizing cache keys.
 * @see https://tanstack.com/query/latest/docs/react/important-defaults
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...projectKeys.lists(), { ...filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

/**
 * Fetch all projects from the API.
 * @returns Array of Project objects with loading and error states
 */
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 2,
  })
}

/**
 * Fetch a single project by ID.
 * @param id - The project ID to fetch
 * @returns Single Project object with loading and error states
 */
export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch project ${id}`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    enabled: !!id, // Only run query if id is provided
  })
}
