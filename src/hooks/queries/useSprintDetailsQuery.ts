import { useSprintDetails } from './sprints'

/**
 * Wrapper for useSprintDetails with type-safe sprintId parameter
 * Used by SprintDetailLayout for fetching a specific sprint
 */
export function useSprintDetailsQuery(sprintId: string) {
  return useSprintDetails(sprintId)
}
