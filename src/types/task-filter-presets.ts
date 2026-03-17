import type { TaskStatus, TaskPriority } from './task'

/**
 * Filter preset types for composable task filtering
 */

export interface TaskFilterCriteria {
  status?: TaskStatus | TaskStatus[]
  assignee?: string | string[]
  priority?: TaskPriority | TaskPriority[]
  sprint?: string | string[]
}

export interface FilterOperator {
  type: 'AND' | 'OR'
  criteria: TaskFilterCriteria
}

export interface TaskFilterPreset {
  id: string
  name: string
  description: string
  operators: FilterOperator[]
  isDefault?: boolean
}

/**
 * Built-in filter presets for MVP
 */
export const BUILT_IN_PRESETS: Record<string, TaskFilterPreset> = {
  MY_TASKS: {
    id: 'my-tasks',
    name: 'My Tasks',
    description: 'Tasks assigned to me',
    operators: [
      {
        type: 'AND',
        criteria: {
          assignee: 'current-user', // Placeholder - replaced at runtime
        },
      },
    ],
    isDefault: false,
  },
  THIS_SPRINT: {
    id: 'this-sprint',
    name: 'This Sprint',
    description: 'Tasks in the current sprint',
    operators: [
      {
        type: 'AND',
        criteria: {
          sprint: 'current-sprint', // Placeholder - replaced at runtime
        },
      },
    ],
    isDefault: false,
  },
  OVERDUE: {
    id: 'overdue',
    name: 'Overdue',
    description: 'Overdue tasks',
    operators: [
      {
        type: 'AND',
        criteria: {
          status: ['backlog', 'in-progress', 'in-review'],
        },
      },
    ],
    isDefault: false,
  },
  UNASSIGNED: {
    id: 'unassigned',
    name: 'Unassigned',
    description: 'Tasks without an assignee',
    operators: [
      {
        type: 'AND',
        criteria: {
          assignee: 'unassigned',
        },
      },
    ],
    isDefault: false,
  },
}

export function getPresetById(id: string): TaskFilterPreset | undefined {
  return Object.values(BUILT_IN_PRESETS).find((p) => p.id === id)
}

export function getAllPresets(): TaskFilterPreset[] {
  return Object.values(BUILT_IN_PRESETS)
}
