export type ActivityEventType =
  | 'agent-state-change'
  | 'task-status-change'
  | 'message'
  | 'decision'

export interface Activity {
  id: string
  type: ActivityEventType
  agentId: string
  agentName: string
  message: string
  timestamp: string
  details?: Record<string, unknown>
}
