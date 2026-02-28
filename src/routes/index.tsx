/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const teamMembers = [
  { id: 'member-1', name: 'Alice Johnson', role: 'Frontend Engineer' },
  { id: 'member-2', name: 'Bob Smith', role: 'Backend Engineer' },
  { id: 'member-3', name: 'Carol Davis', role: 'DevOps Engineer' },
]

function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Dev Team Simulation</h1>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Team Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Link
                key={member.id}
                to="/$memberId"
                params={{ memberId: member.id }}
                className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 transition-colors"
              >
                <h3 className="font-bold text-lg">{member.name}</h3>
                <p className="text-gray-400">{member.role}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
