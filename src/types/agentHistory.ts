export type HistoryEntryType = 'task_completed' | 'task_started' | 'decision_made' | 'error_encountered' | 'review_requested' | 'code_merged'

export interface HistoryEntry {
  id: string
  agentId: string
  type: HistoryEntryType
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface AgentHistory {
  agentId: string
  entries: HistoryEntry[]
}

export interface AgentDetailResponse {
  id: string
  name: string
  role: string
  status: string
  history: HistoryEntry[]
}
