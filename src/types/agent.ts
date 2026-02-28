export type AgentStatus = 'idle' | 'working' | 'blocked' | 'completed'

export interface Agent {
  id: string
  name: string
  role: string
  status: AgentStatus
  currentTask: string | null
  output: string | null
}
