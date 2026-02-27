/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
  errorComponent: RouteErrorBoundary,
})

function HomePage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Welcome to AI Dev Team Simulation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Agents"
          description="Manage team members"
          icon="👥"
        />
        <Card
          title="Tasks"
          description="View assignments"
          icon="✓"
        />
        <Card
          title="Sprint Board"
          description="Track progress"
          icon="📋"
        />
        <Card
          title="Live Feed"
          description="Real-time updates"
          icon="📡"
        />
      </div>
    </div>
  )
}

interface CardProps {
  title: string
  description: string
  icon: string
}

function Card({ title, description, icon }: CardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-600 transition-colors">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  )
}

function RouteErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="p-8">
      <div className="bg-red-900 border border-red-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-red-200 mb-2">Error Loading Home</h3>
        <p className="text-red-100">{error.message}</p>
      </div>
    </div>
  )
}
