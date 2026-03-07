export type AgentRole = 'sr-dev' | 'junior' | 'pm'
export type AgentStatus = 'idle' | 'working' | 'blocked' | 'completed'
export type AgentAvailabilityStatus = 'idle' | 'active' | 'busy' | 'offline'
export type AgentTaskStatus = 'active' | 'idle' | 'busy' | 'offline'
export type TaskHistoryStatus = 'completed' | 'failed' | 'cancelled'

export interface Agent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  currentTask: string
  output: string
  lastUpdated: string
}

export interface AgentHistoryEntry {
  id: string
  timestamp: string
  task: string
  status: TaskHistoryStatus
  duration: number
}

export interface AgentAvailability {
  id: string
  name: string
  role: AgentRole
  status: AgentAvailabilityStatus
  statusChangedAt: string
  currentTaskId?: string
  capabilities: string[]
  metadata: {
    lastActivityAt: string
    tasksCompleted: number
    tasksInProgress: number
    errorRate: number
  }
}

/**
 * Agent Management System - Core Agent type for lifecycle management
 * Used in the Agent Management Dashboard for agent CRUD operations
 */
export interface AgentManagement {
  id: string
  name: string
  capabilities: string[]
  status: AgentTaskStatus
  rateLimit?: {
    requestsPerMinute: number
  }
  taskCount: number
  successRate: number
  createdAt: string
  updatedAt: string
}

/**
 * Agent statistics for dashboard display
 * Includes task metrics and performance indicators
 */
export interface AgentStats {
  currentTasks: number
  completedTasks: number
  successRate: number
  avgCompletionTime: number
}
