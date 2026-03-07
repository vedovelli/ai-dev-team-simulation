import { useSprints } from './sprints'

/**
 * Alias for useSprints with default pagination parameters
 * Used by SprintListLayout for fetching all sprints
 */
export function useSprintsQuery() {
  return useSprints(1, 100) // Fetch up to 100 sprints
}
