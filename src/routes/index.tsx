/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">AI Dev Team Simulation</h1>
        <p className="text-xl text-slate-400 mb-8">
          Simulate and manage AI development teams
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="/teams"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            View Teams
          </a>
          <a
            href="/create"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
          >
            Create New
          </a>
        </div>
      </div>
    </div>
  )
}
