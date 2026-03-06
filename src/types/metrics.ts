/**
 * Agent Performance Metrics Types
 *
 * Defines the structure for agent performance data, time-series metrics,
 * and performance summaries used in the Agent Performance Dashboard.
 */

/**
 * Individual agent performance metrics
 */
export interface AgentMetrics {
  agentId: string
  agentName: string
  agentRole: string
  totalTasks: number
  completedTasks: number
  failedTasks: number
  inProgressTasks: number
  completionRate: number // percentage 0-100
  averageTimeToComplete: number // in minutes
  errorRate: number // percentage 0-100
  performanceTier: 'excellent' | 'good' | 'average' | 'below-average'
  successRate: number // percentage 0-100
  lastActivityAt: string // ISO 8601 timestamp
}

/**
 * Time-series data point for metrics charts
 */
export interface TimeSeriesDataPoint {
  timestamp: string // ISO 8601 timestamp
  value: number
  metric: string
  granularity: 'hourly' | 'daily'
}

/**
 * Summary of performance metrics across all agents
 */
export interface PerformanceSummary {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  activeAgents: number
  averageCompletionTime: number // in minutes
  overallCompletionRate: number // percentage 0-100
  overallErrorRate: number // percentage 0-100
  systemHealthScore: number // 0-100
  lastUpdatedAt: string // ISO 8601 timestamp
}

/**
 * Complete metrics response from the backend
 */
export interface MetricsResponse {
  summary: PerformanceSummary
  timeSeriesData: TimeSeriesDataPoint[]
  agentMetrics: AgentMetrics[]
}
