export type AgentRole = 'sr-dev' | 'junior' | 'pm'
export type AgentStatus = 'idle' | 'working' | 'blocked' | 'completed'
export type AgentAvailabilityStatus = 'idle' | 'active' | 'busy' | 'offline'
export type AgentTaskStatus = 'active' | 'idle' | 'busy' | 'offline'
export type TaskHistoryStatus = 'completed' | 'failed' | 'cancelled'
export type AgentPresenceStatus = 'online' | 'away' | 'offline' | 'busy'

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

/**
 * Real-time presence information for agents
 * Tracks online/offline status with timestamps
 */
export interface AgentPresence {
  id: string
  name: string
  role: AgentRole
  presence: AgentPresenceStatus
  lastSeenAt: string
  statusChangeReason?: 'timeout' | 'user-action' | 'manual' | 'task-assignment'
}

/**
 * Daily availability information for an agent on a specific date
 * Used for calendar view to show availability status and conflicts
 */
export interface DailyAvailability {
  date: string // ISO 8601 date (YYYY-MM-DD)
  agentId: string
  availabilityStatus: 'available' | 'unavailable' | 'partial'
  tasksScheduled: number
  hasConflict: boolean
  conflictReason?: string
}

/**
 * Agent calendar availability data
 * Contains daily availability information for a month/range
 */
export interface AgentCalendarAvailability {
  agentId: string
  agentName: string
  month: number // 1-12
  year: number
  dailyAvailability: DailyAvailability[]
}
