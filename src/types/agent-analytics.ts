/**
 * Agent Health & Workload Analytics Types (FAB-345)
 *
 * Aggregates agent capacity and performance metrics for workload visualization,
 * sprint dashboards, and capacity planning features.
 */

/**
 * Current workload information for an agent
 */
export interface AgentWorkload {
  tasksAssigned: number
  capacityLimit: number
  utilizationPercent: number
}

/**
 * Performance metrics for an agent
 */
export interface AgentPerformanceMetrics {
  completionRate: number // percentage 0-100
  avgTaskDuration: number // in hours
  successRatio: number // percentage 0-100
}

/**
 * Performance trend data point
 */
export interface PerformanceTrendPoint {
  timestamp: string // ISO 8601
  velocity: number // tasks completed
  burndownForecast: number // projected remaining tasks
}

/**
 * Single agent analytics data
 */
export interface AgentAnalytics {
  agentId: string
  agentName: string
  workload: AgentWorkload
  performance: AgentPerformanceMetrics
  trends: PerformanceTrendPoint[]
  lastUpdated: string // ISO 8601
}

/**
 * Team-wide workload distribution
 */
export interface TeamWorkloadDistribution {
  agentId: string
  agentName: string
  tasksAssigned: number
  capacityLimit: number
  utilizationPercent: number
}

/**
 * Team overview analytics
 */
export interface TeamAnalytics {
  agents: AgentAnalytics[]
  workloadDistribution: TeamWorkloadDistribution[]
  teamAverageUtilization: number // percentage 0-100
  teamVelocity: number // average tasks completed per day
  projectedBurndown: number // estimated completion days
  lastUpdated: string // ISO 8601
}

/**
 * Response type for useAgentAnalytics hook
 * Can be either single agent or team analytics depending on parameters
 */
export type AgentAnalyticsResponse = AgentAnalytics | TeamAnalytics

/**
 * Type guard to check if response is team analytics
 */
export function isTeamAnalytics(
  data: AgentAnalyticsResponse
): data is TeamAnalytics {
  return 'agents' in data && Array.isArray(data.agents)
}

/**
 * Type guard to check if response is single agent analytics
 */
export function isSingleAgentAnalytics(
  data: AgentAnalyticsResponse
): data is AgentAnalytics {
  return 'agentId' in data && !Array.isArray((data as any).agents)
}
