/**
 * Domain types for the AI Dev Team Simulation
 */

export enum TaskState {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export interface Agent {
  id: string
  name: string
  role: string
  availability: 'available' | 'busy' | 'unavailable'
  currentTask?: string
  completedTasks: number
}

export interface Task {
  id: string
  title: string
  description: string
  state: TaskState
  assignedTo?: string
  sprintId: string
  complexity: 'JUNIOR' | 'SENIOR' | 'ARCHITECT'
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'completed'
  tasks: string[] // Task IDs
}
