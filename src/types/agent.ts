export type AgentRole = 'sr-dev' | 'junior' | 'pm'
export type AgentStatus = 'idle' | 'working' | 'blocked' | 'completed'

export interface Agent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  currentTask: string
  output: string
  lastUpdated: string
}
