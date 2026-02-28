export type AgentRole = 'senior-dev' | 'junior-dev' | 'qa' | 'devops' | 'designer'

export type AgentStatus = 'idle' | 'working' | 'blocked'

export interface Agent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  currentTask?: string
  lastUpdated: number
}

export interface AgentStatusResponse {
  id: string
  status: AgentStatus
  currentTask?: string
  lastUpdated: number
}
