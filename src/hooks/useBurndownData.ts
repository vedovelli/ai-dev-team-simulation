import { useMemo } from 'react'
import type { Task } from '../types/task'
import type { Sprint } from '../types/sprint'
import type { BurndownDataPoint } from '../types/sprint'

export function useBurndownData(sprint: Sprint | undefined, tasks: Task[] | undefined) {
  return useMemo(() => {
    if (!sprint || !tasks) return []

    const startDate = sprint.startDate ? new Date(sprint.startDate) : new Date(sprint.createdAt)
    const endDate = sprint.endDate ? new Date(sprint.endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    const sprintDuration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    )

    const totalPoints = sprint.estimatedPoints

    // Group tasks by completion date
    const pointsByDate: Record<string, number> = {}
    let cumulativePoints = 0

    tasks
      .filter((task) => task.status === 'done')
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      .forEach((task) => {
        const taskDate = new Date(task.updatedAt)
        const dateStr = taskDate.toISOString().split('T')[0]

        if (!pointsByDate[dateStr]) {
          pointsByDate[dateStr] = 0
        }
        pointsByDate[dateStr] += task.storyPoints
      })

    // Build burndown series
    const burndownData: BurndownDataPoint[] = []

    for (let day = 0; day <= sprintDuration; day++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + day)
      const dateStr = currentDate.toISOString().split('T')[0]

      // Calculate actual progress
      if (pointsByDate[dateStr]) {
        cumulativePoints += pointsByDate[dateStr]
      }

      // Ideal line: linear from totalPoints to 0
      const ideal = Math.max(0, totalPoints - (totalPoints / sprintDuration) * day)

      burndownData.push({
        day,
        ideal: Math.round(ideal * 100) / 100,
        actual: cumulativePoints,
        date: dateStr,
      })
    }

    return burndownData
  }, [sprint, tasks])
}
