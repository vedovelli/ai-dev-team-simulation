import { useSprintsList } from '../hooks/useSprintsList'
import { SprintListCard } from './SprintListCard'

export function SprintList() {
  const { data: sprints = [], isLoading, error } = useSprintsList()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-900 border border-slate-700 rounded-lg p-6 h-40 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
        <h3 className="font-semibold mb-2">Failed to load sprints</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  if (sprints.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">No sprints found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {sprints.map((sprint) => (
        <SprintListCard key={sprint.id} sprint={sprint} />
      ))}
    </div>
  )
}
