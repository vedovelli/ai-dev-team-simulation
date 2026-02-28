/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/teams')({
  component: TeamsPage,
})

function TeamsPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <h1 className="text-3xl font-bold">Teams</h1>
    </main>
  )
}
