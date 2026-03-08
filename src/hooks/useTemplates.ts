import { useQuery } from '@tanstack/react-query'
import type { TaskTemplate } from '../types/template'

/**
 * Fetch all task templates
 *
 * Uses TanStack Query for caching and automatic synchronization.
 * Query is automatically invalidated when mutations complete.
 *
 * @returns Query object with templates data, loading, and error states
 *
 * @example
 * const { data: templates, isLoading } = useTemplates()
 * if (isLoading) return <LoadingSpinner />
 * return <TemplateList templates={templates} />
 */
export function useTemplates() {
  const queryKey = ['templates']

  return useQuery<TaskTemplate[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch('/api/templates')

      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const result = (await response.json()) as { data: TaskTemplate[] }
      return result.data
    },
  })
}
