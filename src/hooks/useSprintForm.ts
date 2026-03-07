import { useForm, FormState } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { useState } from 'react'
import type { Sprint } from '../types/sprint'

/**
 * Sprint form mode type
 */
export type SprintFormMode = 'create' | 'update'

/**
 * Sprint form data structure
 */
export interface SprintFormData {
  name: string
  startDate: string
  endDate: string
  teamAssignment: string
}

/**
 * Sprint form submission result
 */
export interface SprintFormResult {
  success: boolean
  error?: string
  data?: Sprint
}

/**
 * Options for useSprintForm hook
 */
interface UseSprintFormOptions {
  /** Initial sprint data for edit mode */
  initialData?: Sprint
  /** Form submission callback */
  onSubmit: (
    data: SprintFormData,
    mode: SprintFormMode
  ) => Promise<SprintFormResult>
  /** Form mode: create or update */
  mode?: SprintFormMode
}

/**
 * Validation schema for sprint form
 */
const sprintFormSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Sprint name must be at least 3 characters')
      .max(50, 'Sprint name must not exceed 50 characters'),
    startDate: z
      .string()
      .refine(
        (date) => {
          // Valid ISO date format
          try {
            new Date(date).toISOString()
            return !isNaN(Date.parse(date))
          } catch {
            return false
          }
        },
        'Start date must be a valid ISO date'
      ),
    endDate: z
      .string()
      .refine(
        (date) => {
          try {
            new Date(date).toISOString()
            return !isNaN(Date.parse(date))
          } catch {
            return false
          }
        },
        'End date must be a valid ISO date'
      ),
    teamAssignment: z
      .string()
      .min(1, 'Team assignment is required')
      .refine(
        (id) => id.length > 0,
        'Team assignment must be a valid team ID'
      ),
  })
  .refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

/**
 * Custom hook for sprint form management with TanStack Form validation
 *
 * Handles sprint creation and editing with comprehensive validation.
 * Prevents editing start/end dates for closed sprints.
 *
 * @example
 * ```tsx
 * function SprintForm({ sprint }: { sprint?: Sprint }) {
 *   const form = useSprintForm({
 *     initialData: sprint,
 *     mode: sprint ? 'update' : 'create',
 *     onSubmit: async (data, mode) => {
 *       const endpoint = mode === 'create' ? '/api/sprints' : `/api/sprints/${sprint?.id}`
 *       const method = mode === 'create' ? 'POST' : 'PATCH'
 *       const response = await fetch(endpoint, {
 *         method,
 *         body: JSON.stringify(data),
 *       })
 *       return response.ok
 *         ? { success: true, data: await response.json() }
 *         : { success: false, error: 'Submission failed' }
 *     },
 *   })
 *
 *   return (
 *     <form
 *       onSubmit={(e) => {
 *         e.preventDefault()
 *         form.handleSubmit()
 *       }}
 *     >
 *       <input
 *         type="text"
 *         value={form.state.values.name}
 *         onChange={(e) => form.setFieldValue('name', e.target.value)}
 *       />
 *       <button type="submit" disabled={form.state.isSubmitting}>
 *         {form.mode === 'create' ? 'Create Sprint' : 'Update Sprint'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 */
export function useSprintForm({
  initialData,
  onSubmit,
  mode: initialMode = 'create',
}: UseSprintFormOptions) {
  const [mode, setMode] = useState<SprintFormMode>(initialMode)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isClosedSprint, setIsClosedSprint] = useState(
    initialData?.status === 'completed'
  )

  // Default values for create mode
  const defaultValues: SprintFormData = {
    name: initialData?.name || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    teamAssignment: initialData?.id || '',
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setSubmitError(null)

      // Prevent editing dates for closed sprints
      if (mode === 'update' && isClosedSprint) {
        if (
          initialData &&
          (value.startDate !== initialData.startDate ||
            value.endDate !== initialData.endDate)
        ) {
          setSubmitError('Cannot edit dates for closed sprints')
          return
        }
      }

      try {
        const result = await onSubmit(value, mode)
        if (!result.success) {
          setSubmitError(result.error || 'Submission failed')
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'An error occurred'
        )
      }
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: sprintFormSchema,
      onBlur: sprintFormSchema,
    },
  })

  // Track dirty state (fields modified from initial values)
  const isDirty =
    JSON.stringify(form.state.values) !== JSON.stringify(defaultValues)

  // Extend form state with custom properties
  const extendedFormState = {
    ...form.state,
    mode,
    isDirty,
    isClosed: isClosedSprint,
    submitError,
  }

  return {
    ...form,
    state: extendedFormState,
    mode,
    setMode,
    isDirty,
    submitError,
    clearError: () => setSubmitError(null),
  }
}

export type UseSprintFormReturn = ReturnType<typeof useSprintForm>
