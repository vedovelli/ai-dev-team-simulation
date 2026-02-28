import { useTeamMembers } from '../../hooks/useTeamMembers'

export function TeamMembersTable() {
  const { data, isLoading, error } = useTeamMembers()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-white">Loading team members...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-900 rounded">
        <p className="text-white">Failed to load team members. Please try again.</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-white">No team members found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-800">
            <th className="border border-slate-700 px-4 py-2 text-left text-white">
              Name
            </th>
            <th className="border border-slate-700 px-4 py-2 text-left text-white">
              Role
            </th>
            <th className="border border-slate-700 px-4 py-2 text-left text-white">
              Email
            </th>
            <th className="border border-slate-700 px-4 py-2 text-left text-white">
              Status
            </th>
            <th className="border border-slate-700 px-4 py-2 text-left text-white">
              Joined
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((member) => (
            <tr key={member.id} className="hover:bg-slate-800">
              <td className="border border-slate-700 px-4 py-2 text-white">
                {member.name}
              </td>
              <td className="border border-slate-700 px-4 py-2 text-white">
                {member.role}
              </td>
              <td className="border border-slate-700 px-4 py-2 text-white">
                {member.email}
              </td>
              <td className="border border-slate-700 px-4 py-2">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    member.status === 'active'
                      ? 'bg-green-700 text-white'
                      : member.status === 'idle'
                        ? 'bg-yellow-700 text-white'
                        : 'bg-gray-600 text-white'
                  }`}
                >
                  {member.status}
                </span>
              </td>
              <td className="border border-slate-700 px-4 py-2 text-white">
                {member.joinedAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
