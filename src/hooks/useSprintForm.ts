import { useQueryClient } from '@tanstack/react-query'
import type { Agent } from '../types/agent'
import type { TeamCapacity } from '../types/sprint'

/**
 * Form data for sprint planning with capacity awareness
 */
export interface SprintFormData {
  name: string
  goals: string
  status: 'planning' | 'active' | 'completed'
  estimatedPoints: number
  startDate: string
  endDate: string
  assignedAgents: string[]
}

/**
 * Capacity validation result
 */
export interface CapacityValidation {
  isValid: boolean
  message?: string
  utilizationRate?: number
  availableCapacity?: number
}

/**
 * Agent with load information
 */
export interface AgentWithLoad extends Agent {
  currentLoad: number
  maxCapacity: number
  utilizationRate: number
}

/**
 * Custom hook for sprint form logic with capacity calculations
 *
 * Features:
 * - Cross-field validation (date ranges, capacity constraints)
 * - Real-time capacity calculations
 * - Agent load visibility
 * - Over-capacity warnings
 */
export const useSprintForm = () => {
  const queryClient = useQueryClient()

  /**
   * Validates date range (end date must be after start date)
   */
  const validateDateRange = (startDate: string, endDate: string): string | undefined => {
    if (!startDate || !endDate) {
      return undefined
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid date format'
    }

    if (end <= start) {
      return 'End date must be after start date'
    }

    return undefined
  }

  /**
   * Calculate sprint duration in days
   */
  const calculateSprintDuration = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end.getTime() - start.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  /**
   * Check agent capacity constraints
   * Max 10 tasks per agent per sprint
   */
  const checkAgentCapacity = async (agentId: string): Promise<CapacityValidation> => {
    try {
      const response = await fetch(`/api/agents/${agentId}/capacity`)
      if (!response.ok) {
        return {
          isValid: false,
          message: 'Unable to check agent capacity',
        }
      }

      const data = (await response.json()) as {
        currentLoad: number
        maxCapacity: number
      }

      const utilizationRate = (data.currentLoad / data.maxCapacity) * 100
      const isOverCapacity = data.currentLoad >= data.maxCapacity

      return {
        isValid: !isOverCapacity,
        message: isOverCapacity ? 'Agent is at maximum capacity' : undefined,
        utilizationRate,
        availableCapacity: Math.max(0, data.maxCapacity - data.currentLoad),
      }
    } catch {
      return {
        isValid: true, // Allow on network error
        message: undefined,
      }
    }
  }

  /**
   * Validate team capacity for assigned agents
   */
  const validateTeamCapacity = async (
    agentIds: string[],
    estimatedPoints: number
  ): Promise<CapacityValidation> => {
    if (agentIds.length === 0) {
      return {
        isValid: true,
      }
    }

    try {
      const response = await fetch('/api/sprints/capacity/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentIds,
          estimatedPoints,
        }),
      })

      if (!response.ok) {
        return {
          isValid: true, // Allow on error
        }
      }

      const data = (await response.json()) as {
        isValid: boolean
        utilizationRate: number
        message?: string
      }

      return {
        isValid: data.isValid,
        utilizationRate: data.utilizationRate,
        message: data.message,
      }
    } catch {
      return {
        isValid: true, // Allow on network error
      }
    }
  }

  /**
   * Get available agents for team assignment
   */
  const getAvailableAgents = async (): Promise<AgentWithLoad[]> => {
    try {
      const response = await fetch('/api/agents?status=idle,available')
      if (!response.ok) {
        return []
      }

      const agents = (await response.json()) as Agent[]
      return agents.map((agent) => ({
        ...agent,
        currentLoad: 0,
        maxCapacity: 10,
        utilizationRate: 0,
      }))
    } catch {
      return []
    }
  }

  /**
   * Cross-field validation for sprint form
   */
  const validateForm = async (data: SprintFormData): Promise<Record<string, string>> => {
    const errors: Record<string, string> = {}

    // Date validation
    const dateError = validateDateRange(data.startDate, data.endDate)
    if (dateError) {
      errors.dateRange = dateError
    }

    // Capacity validation for assigned agents
    if (data.assignedAgents.length > 0) {
      const capacityResult = await validateTeamCapacity(
        data.assignedAgents,
        data.estimatedPoints
      )
      if (!capacityResult.isValid && capacityResult.message) {
        errors.capacity = capacityResult.message
      }
    }

    // Sprint name validation
    if (!data.name || data.name.trim() === '') {
      errors.name = 'Sprint name is required'
    } else if (data.name.length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (data.name.length > 100) {
      errors.name = 'Name must not exceed 100 characters'
    }

    return errors
  }

  return {
    validateDateRange,
    calculateSprintDuration,
    checkAgentCapacity,
    validateTeamCapacity,
    getAvailableAgents,
    validateForm,
  }
}
