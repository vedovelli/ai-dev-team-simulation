export type SprintStatus = 'planning' | 'active' | 'completed'

export interface Sprint {
  id: string
  name: string
  status: SprintStatus
  goals: string
  tasks: string[]
  estimatedPoints: number
  taskCount: number
  completedCount: number
  createdAt: string
  startDate?: string
  endDate?: string
}

export type TaskStatus = 'backlog' | 'in-progress' | 'in-review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface SprintTask {
  id: string
  title: string
  status: TaskStatus
  assignee: string
  priority: TaskPriority
  sprintId: string
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

export interface TeamMemberCapacity {
  id: string
  name: string
  role: string
  allocatedPoints: number
  maxCapacity: number
  utilizationRate: number // 0-100
  availability: 'available' | 'busy' | 'unavailable'
}

export interface TeamCapacity {
  sprintId: string
  members: TeamMemberCapacity[]
  totalCapacity: number
  allocatedCapacity: number
  availableCapacity: number
}
