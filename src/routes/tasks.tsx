/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tasks')({
  component: TasksPage,
  errorComponent: RouteErrorBoundary,
})

function TasksPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Tasks</h2>
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-slate-300">
          View and manage all tasks assigned to your development team.
        </p>
      </div>
    </div>
  )
}

function RouteErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="p-8">
      <div className="bg-red-900 border border-red-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-red-200 mb-2">Error Loading Tasks</h3>
        <p className="text-red-100">{error.message}</p>
      </div>
    </div>
  )
}
