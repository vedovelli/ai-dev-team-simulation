/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { AgentsList } from '../components/AgentsList'

export const Route = createFileRoute('/agents')({
  component: AgentsPage,
})

function AgentsPage() {
  return (
    <main className="h-screen bg-slate-900 text-white">
      <AgentsList />
    </main>
  )
}
