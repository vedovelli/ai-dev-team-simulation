/* eslint-disable react-refresh/only-export-components */
// The route component is passed to createFileRoute and exported as Route,
// so react-refresh won't detect it as a component export directly
import { createFileRoute, Link } from '@tanstack/react-router'

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
          <Link
            to="/teams"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            View Teams
          </Link>
          <Link
            to="/create"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
          >
            Create New
          </Link>
        </div>
      </div>
    </div>
  )
}
