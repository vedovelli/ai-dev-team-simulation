/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { AgentDashboard } from '../components/AgentDashboard'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Agent Dashboard</h1>
        <AgentDashboard />
      </div>
    </main>
  )
}
