export interface TimeSeriesDataPoint {
  timestamp: string
  value: number
  metric: string
  granularity?: 'daily' | 'weekly'
}

export interface AgentMetrics {
  agentId: string
  agentName: string
  completedTasks: number
  completionRate: number
  averageDuration: number
  performanceTier: 'excellent' | 'good' | 'average' | 'needs_improvement'
  activeTaskCount: number
}

export interface SprintMetric {
  sprintId: string
  sprintName: string
  completedTasks: number
  totalTasks: number
  completionRate: number
  velocity: number
  burndownData: BurndownDataPoint[]
  projectedCompletionDate: string
  status: 'planning' | 'active' | 'completed'
}

export interface BurndownDataPoint {
  date: string
  remaining: number
  ideal: number
  completed: number
}

export interface TaskDistributionItem {
  id: string
  title: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  agentId: string
  agentName: string
  createdAt: string
  completedAt?: string
  duration?: number
}

export interface AnalyticsSummary {
  totalAgents: number
  activeAgents: number
  averageCompletionRate: number
  totalTasksCompleted: number
  overallVelocity: number
  avgTaskDuration: number
}

export interface AnalyticsDashboardData {
  summary: AnalyticsSummary
  agentMetrics: AgentMetrics[]
  sprintMetrics: SprintMetric[]
  agentUtilizationTimeSeries: TimeSeriesDataPoint[]
  sprintVelocityTimeSeries: TimeSeriesDataPoint[]
  lastUpdated: string
}

export interface TaskDistributionResponse {
  items: TaskDistributionItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface AnalyticsFilters {
  timeRange: '7d' | '30d' | '90d' | 'all'
  priority?: 'critical' | 'high' | 'medium' | 'low'
  status?: 'todo' | 'in_progress' | 'review' | 'completed'
  agentId?: string
}
