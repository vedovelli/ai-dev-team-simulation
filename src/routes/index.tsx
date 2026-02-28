/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TeamMemberForm } from '../components/TeamMemberForm'
import type { TeamMember } from '../types/team'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [showForm, setShowForm] = useState(false)

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const response = await fetch('/api/team-members')
      if (!response.ok) throw new Error('Failed to fetch team members')
      return response.json() as Promise<TeamMember[]>
    },
  })

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">AI Dev Team Simulation</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
          >
            {showForm ? 'Cancel' : 'Add Member'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {showForm && (
            <div className="lg:col-span-1">
              <TeamMemberForm onSuccess={() => setShowForm(false)} />
            </div>
          )}

          <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Team Members</h2>

              {isLoading ? (
                <p className="text-slate-400">Loading...</p>
              ) : teamMembers.length === 0 ? (
                <p className="text-slate-400">No team members yet.</p>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 bg-slate-700 rounded-md border border-slate-600 hover:border-slate-500 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-white">
                            {member.name}
                          </h3>
                          <p className="text-sm text-slate-300">{member.role}</p>
                          <p className="text-xs text-slate-400">{member.email}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            member.status === 'active'
                              ? 'bg-green-900 text-green-100'
                              : member.status === 'idle'
                                ? 'bg-yellow-900 text-yellow-100'
                                : 'bg-gray-700 text-gray-100'
                          }`}
                        >
                          {member.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
