import { useNavigate } from '@tanstack/react-router'
import type { Sprint } from '../types/sprint'

const STATUS_COLORS: Record<Sprint['status'], string> = {
  planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const STATUS_LABELS: Record<Sprint['status'], string> = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
}

export interface SprintListCardProps {
  sprint: Sprint
}

export function SprintListCard({ sprint }: SprintListCardProps) {
  const navigate = useNavigate()
  const progress = sprint.taskCount > 0 ? (sprint.completedCount / sprint.taskCount) * 100 : 0

  return (
    <button
      onClick={() => navigate({ to: `/sprints/$id`, params: { id: sprint.id } })}
      className="block w-full p-6 bg-slate-900 border border-slate-700 rounded-lg hover:border-slate-500 hover:bg-slate-800 transition-colors text-left"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{sprint.name}</h3>
          <p className="text-sm text-slate-400 line-clamp-2">{sprint.goals}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[sprint.status]}`}>
          {STATUS_LABELS[sprint.status]}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-slate-400">Progress</span>
            <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">Tasks</p>
            <p className="text-white font-semibold text-lg">{sprint.taskCount}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">Completed</p>
            <p className="text-green-400 font-semibold text-lg">{sprint.completedCount}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">Points</p>
            <p className="text-white font-semibold text-lg">{sprint.estimatedPoints}</p>
          </div>
        </div>
      </div>
    </button>
  )
}
