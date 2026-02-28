import { createFileRoute } from '@tanstack/react-router'
import { SprintPlanningForm } from '../../components/SprintPlanningForm'

export const Route = createFileRoute('/sprints/new')({
  component: SprintPlanningForm,
})
