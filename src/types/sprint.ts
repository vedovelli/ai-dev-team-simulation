export interface Sprint {
  id: string
  name: string
  goals: string
  tasks: string[]
  estimatedPoints: number
  createdAt: string
  startDate?: string
  endDate?: string
}

export interface SprintMetrics {
  sprintId: string
  totalPoints: number
  completedPoints: number
  remainingPoints: number
  daysRemaining: number
  daysElapsed: number
  sprintDuration: number
  velocity: number
  onTrack: boolean
  completionPercentage: number
}

export interface BurndownDataPoint {
  day: number
  ideal: number
  actual: number
  date: string
}

export interface SprintHealthData {
  sprint: Sprint
  metrics: SprintMetrics
  burndownData: BurndownDataPoint[]
}
