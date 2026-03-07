import { createFileRoute } from '@tanstack/react-router'
import { TasksDashboard } from '../pages/dashboard/TasksDashboard'
import { Suspense } from 'react'

/* eslint-disable react-refresh/only-export-components */

function TasksPage() {
  return <TasksDashboard />
}

function TasksPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">Task History & Performance</h1>
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-500">Loading task metrics...</p>
          </div>
        </div>
      }
    >
      <TasksPage />
    </Suspense>
  )
}

export const Route = createFileRoute('/dashboard/tasks')({
  component: TasksPageWithSuspense,
})
