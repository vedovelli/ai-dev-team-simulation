export type AgentRole = 'sr-dev' | 'junior' | 'pm'
export type AgentStatus = 'idle' | 'working' | 'blocked' | 'completed'
export type AgentAvailabilityStatus = 'online' | 'busy' | 'offline'
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
 * Agent live status for polling endpoint
 * Used by useAgentStatus hook for real-time availability tracking
 */
export type AgentLiveStatus = 'available' | 'busy' | 'offline'

/**
 * Agent status response from polling endpoint
 * Tracks current availability, capacity, and last update time
 */
export interface AgentStatusResponse {
  agentId: string
  name: string
  status: AgentLiveStatus
  currentTaskCount: number
  maxCapacity: number
  lastUpdatedAt: string
}
