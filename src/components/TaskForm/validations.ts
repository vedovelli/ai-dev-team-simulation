import type { TaskFormData } from '../../types/task'

export const validations = {
  name: {
    validate: (value: string): string | undefined => {
      if (!value) {
        return 'Task name is required'
      }
      if (value.length < 3) {
        return 'Task name must be at least 3 characters'
      }
      if (value.length > 100) {
        return 'Task name must not exceed 100 characters'
      }
      return undefined
    },
  },

  description: {
    validate: (value?: string): string | undefined => {
      if (value && value.length > 500) {
        return 'Description must not exceed 500 characters'
      }
      return undefined
    },
  },

  status: {
    validate: (value: string): string | undefined => {
      if (!value) {
        return 'Status is required'
      }
      if (!['todo', 'in-progress', 'done'].includes(value)) {
        return 'Invalid status'
      }
      return undefined
    },
  },

  priority: {
    validate: (value: string): string | undefined => {
      if (!value) {
        return 'Priority is required'
      }
      if (!['low', 'medium', 'high'].includes(value)) {
        return 'Invalid priority'
      }
      return undefined
    },
  },

  dueDate: {
    validate: (value?: string, priority?: string): string | undefined => {
      // Due date is required if priority is high
      if (priority === 'high' && !value) {
        return 'Due date is required for high priority tasks'
      }

      if (value) {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          return 'Invalid date format'
        }
      }

      return undefined
    },
  },

  tags: {
    validate: (value: string[], status?: string): string | undefined => {
      // Tags are required if status is not 'todo'
      if (status !== 'todo' && value.length === 0) {
        return 'At least one tag is required for non-todo tasks'
      }
      return undefined
    },
  },
}

export function validateForm(
  data: TaskFormData,
): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {}

  // Sync validations
  errors.name = validations.name.validate(data.name)
  errors.description = validations.description.validate(data.description)
  errors.status = validations.status.validate(data.status)
  errors.priority = validations.priority.validate(data.priority)
  errors.dueDate = validations.dueDate.validate(data.dueDate, data.priority)
  errors.tags = validations.tags.validate(data.tags, data.status)

  return errors
}
