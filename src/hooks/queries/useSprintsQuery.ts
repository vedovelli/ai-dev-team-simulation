import { useSprints } from './sprints'

/**
 * Hook for fetching sprints with optional pagination parameters
 * Defaults to page 1 with 100 results per page
 */
export function useSprintsQuery(page: number = 1, limit: number = 100) {
  return useSprints(page, limit)
}
