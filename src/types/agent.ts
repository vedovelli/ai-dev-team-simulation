export type AgentStatus = 'thinking' | 'idle' | 'error'

export interface Agent {
  id: string
  name: string
  role: string
  status: AgentStatus
  currentTask: string | null
  createdAt: string
}
