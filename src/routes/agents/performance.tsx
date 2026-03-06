import { createFileRoute } from '@tanstack/react-router'
import { PerformanceDashboard } from '../../pages/agents/PerformanceDashboard'
import { Suspense } from 'react'

/* eslint-disable react-refresh/only-export-components */

function PerformancePage() {
  return <PerformanceDashboard />
}

function PerformancePageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">Agent Performance Dashboard</h1>
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-500">Loading performance metrics...</p>
          </div>
        </div>
      }
    >
      <PerformancePage />
    </Suspense>
  )
}

export const Route = createFileRoute('/agents/performance')({
  component: PerformancePageWithSuspense,
})
