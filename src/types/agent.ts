export type AgentRole = 'sr-dev' | 'junior' | 'pm'
export type AgentStatus = 'idle' | 'working' | 'blocked' | 'completed'
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
