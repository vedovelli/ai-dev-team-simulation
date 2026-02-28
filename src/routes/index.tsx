/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-8">AI Dev Team Simulation</h1>
        <Link
          to="/tasks"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
        >
          Go to Task Queue
        </Link>
      </div>
    </main>
  )
}
