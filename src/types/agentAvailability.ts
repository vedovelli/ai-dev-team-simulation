/**
 * Agent Availability Types
 *
 * Defines types for managing agent availability calendars, scheduling,
 * and conflict detection between tasks and availability windows.
 */

import type { Task } from './task'

/**
 * A single availability slot for an agent on a specific date
 */
export interface AvailabilitySlot {
  /** ISO date string (YYYY-MM-DD) */
  date: string
  /** Whether the agent is available on this date */
  isAvailable: boolean
  /** Reason for unavailability (PTO, meeting, etc.) */
  reason?: string
  /** Number of tasks assigned on this date */
  taskCount: number
}

/**
 * Date range for availability queries
 */
export interface DateRange {
  /** ISO date string start (YYYY-MM-DD) */
  from: string
  /** ISO date string end (YYYY-MM-DD), exclusive */
  to: string
}

/**
 * Agent availability data normalized by date
 */
export interface AgentAvailabilityData {
  agentId: string
  availabilityByDate: Record<string, AvailabilitySlot>
}

/**
 * Conflict between a task and agent availability
 */
export interface ConflictEntry {
  taskId: string
  agentId: string
  date: string
  reason: string
}

/**
 * Result of conflict detection
 */
export interface ConflictMap {
  hasConflicts: boolean
  conflicts: ConflictEntry[]
  conflictsByAgent: Record<string, ConflictEntry[]>
  conflictsByDate: Record<string, ConflictEntry[]>
}

/**
 * Response from /api/agents/:id/availability endpoint
 */
export interface AvailabilityApiResponse {
  agentId: string
  availabilitySlots: AvailabilitySlot[]
}

/**
 * Batch response for multiple agents' availability
 */
export interface BatchAvailabilityResponse {
  [agentId: string]: AvailabilitySlot[]
}
