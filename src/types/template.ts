import type { TaskStatus, TaskPriority } from './task'

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  defaultFields: {
    title?: string
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    estimatedHours?: number
    labels?: string[]
  }
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateInput {
  name: string
  description?: string
  defaultFields: {
    title?: string
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    estimatedHours?: number
    labels?: string[]
  }
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
  defaultFields?: {
    title?: string
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    estimatedHours?: number
    labels?: string[]
  }
}

export interface TemplateValidationResponse {
  isValid: boolean
  errors?: Record<string, string>
}
