import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/agents')({
  component: AgentsPage,
})

function AgentsPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900">Agents</h2>
      <p className="mt-2 text-gray-600">Agents list will be displayed here</p>
    </div>
  )
}
