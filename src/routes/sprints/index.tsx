import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { TaskBoard } from './board'
import { SprintsSearchParamSchema } from '../../lib/router-types'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'

// Route loader for sprints
async function loadSprints() {
  // Data will be loaded via queries in TaskBoard component
  return null
}

function TaskBoardWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Sprint Board</h1>
            <div className="flex items-center justify-center py-16">
              <p className="text-slate-400">Loading sprint data...</p>
            </div>
          </div>
        </div>
      }
    >
      <TaskBoard />
    </Suspense>
  )
}

export const Route = createFileRoute('/sprints/')({
  component: TaskBoardWrapper,
  loader: loadSprints,
  validateSearch: (search): Record<string, unknown> => {
    try {
      return SprintsSearchParamSchema.parse(search)
    } catch (error) {
      console.warn('Invalid search parameters:', error)
      return {}
    }
  },
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})
