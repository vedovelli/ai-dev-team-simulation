/**
 * Agent Performance Analytics Types
 *
 * Defines KPI structures for per-agent performance tracking
 * and analytics data used in dashboards and decision-making.
 */

/**
 * Per-agent performance KPIs
 * Used for sprint dashboard agent cards and workload analysis
 */
export interface AgentPerformance {
  /** Unique agent identifier */
  agentId: string

  /** Total tasks completed by this agent */
  tasksCompleted: number

  /** Velocity: tasks completed per day (average) */
  velocity: number

  /** On-time delivery rate (0-100%) */
  onTimeRate: number

  /** Average days to complete a task */
  avgCompletionDays: number

  /** Timestamp of last update */
  updatedAt: string
}
