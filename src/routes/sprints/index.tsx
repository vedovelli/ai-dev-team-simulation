import { createFileRoute } from '@tanstack/react-router'
import { TaskBoard } from './board'
import { isValidStatus, isValidPriority } from '../../utils/filterValidation'

export const Route = createFileRoute('/sprints/')({
  component: TaskBoard,
  validateSearch: (search: Record<string, unknown>) => {
    const status = search.status ? String(search.status) : undefined
    const priority = search.priority ? String(search.priority) : undefined
    const searchTerm = search.search ? String(search.search) : undefined
    const team = search.team ? String(search.team) : undefined
    const sprint = search.sprint ? String(search.sprint) : undefined
    const assignee = search.assignee ? String(search.assignee) : undefined

    // Validate status and priority, clear invalid ones with warning
    if (status && !isValidStatus(status)) {
      console.warn(`Invalid status parameter: ${status}. Clearing.`)
    }
    if (priority && !isValidPriority(priority)) {
      console.warn(`Invalid priority parameter: ${priority}. Clearing.`)
    }

    return {
      status: status && isValidStatus(status) ? status : undefined,
      priority: priority && isValidPriority(priority) ? priority : undefined,
      search: searchTerm,
      team,
      sprint,
      assignee,
    }
  },
})
