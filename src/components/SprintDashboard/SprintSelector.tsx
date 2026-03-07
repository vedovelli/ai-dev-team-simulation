import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Sprint } from '../../types/sprint'

interface SprintSelectorProps {
  sprints: Sprint[]
  currentSprintId?: string
  isLoading?: boolean
}

export function SprintSelector({ sprints, currentSprintId, isLoading = false }: SprintSelectorProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(currentSprintId)

  useEffect(() => {
    setSelectedId(currentSprintId)
  }, [currentSprintId])

  const handleSprintChange = (sprintId: string) => {
    setSelectedId(sprintId)
    router.navigate({
      to: '/dashboard',
      search: { sprintId },
      replace: true,
    })
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 animate-pulse">
        <div className="h-10 bg-slate-700 rounded w-full"></div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <label htmlFor="sprint-select" className="block text-sm font-medium text-slate-300 mb-2">
        Select Sprint
      </label>
      <select
        id="sprint-select"
        value={selectedId || ''}
        onChange={(e) => handleSprintChange(e.target.value)}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Sprint selection dropdown"
      >
        <option value="">Choose a sprint...</option>
        {sprints.map((sprint) => (
          <option key={sprint.id} value={sprint.id}>
            {sprint.name} {sprint.status === 'active' ? '(Active)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
