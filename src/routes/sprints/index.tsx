import { createFileRoute } from '@tanstack/react-router'
import { TaskBoard } from './board'

export const Route = createFileRoute('/sprints/')({
  component: TaskBoard,
  validateSearch: (search: Record<string, unknown>) => ({
    status: search.status ? String(search.status) : undefined,
    priority: search.priority ? String(search.priority) : undefined,
    search: search.search ? String(search.search) : undefined,
  }),
})
