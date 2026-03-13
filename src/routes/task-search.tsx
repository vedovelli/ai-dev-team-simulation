import { createFileRoute } from '@tanstack/react-router'
import { TaskSearchPage } from '../components/TaskSearchPage'

export const Route = createFileRoute('/task-search')({
  component: TaskSearchPageRoute,
})

function TaskSearchPageRoute() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <TaskSearchPage />
      </div>
    </div>
  )
}
