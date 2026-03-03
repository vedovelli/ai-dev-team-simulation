import { createFileRoute } from '@tanstack/react-router'
import { KanbanBoard } from '../components/KanbanBoard'

export const Route = createFileRoute('/kanban')({
  component: KanbanBoard,
})
