/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">AI Dev Team Simulation</h1>
        <Link to="/tasks" className="text-xl text-blue-400 hover:text-blue-300">
          Go to Tasks →
        </Link>
      </div>
    </main>
  )
}
