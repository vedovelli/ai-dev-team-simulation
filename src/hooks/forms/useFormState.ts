import { useForm as useTanstackForm, FieldApi, ValidatorAsync } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { ZodSchema } from 'zod'

export interface FieldValidationError {
  message: string
  field?: string
}

export interface FormSubmissionResult<T = unknown> {
  success: boolean
  data?: T
  fieldErrors?: Record<string, string[]>
  serverError?: string
}

export interface UseFormStateConfig<T> {
  defaultValues: T
  schema: ZodSchema
  onSubmit: (data: T) => Promise<FormSubmissionResult<T>>
  onAsyncValidate?: Record<string, (value: unknown) => Promise<string | undefined>>
  onError?: (error: Error | string) => void
}

export interface UseFormStateReturn<T> {
  form: ReturnType<typeof useTanstackForm<T, ValidatorAsync>>
  isSubmitting: boolean
  isValidating: boolean
  submitError: string | null
  fieldErrors: Record<string, string[]>
  handleSubmit: () => Promise<void>
  getFieldError: (fieldName: string) => string | undefined
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  reset: () => void
}

/**
 * useFormState Hook
 *
 * Core form state management hook wrapping TanStack Form.
 * Provides:
 * - Client-side validation with Zod schemas
 * - Async field validation (e.g., email uniqueness)
 * - Server-side validation error handling
 * - Form submission with loading states
 * - Field-level error management
 *
 * @example
 * ```tsx
 * const schema = z.object({
 *   email: z.string().email('Invalid email'),
 *   password: z.string().min(8, 'Password too short'),
 * })
 *
 * const { form, handleSubmit, getFieldError, isSubmitting } = useFormState({
 *   defaultValues: { email: '', password: '' },
 *   schema,
 *   onSubmit: async (data) => {
 *     const response = await api.submit(data)
 *     return response.success
 *       ? { success: true, data: response.data }
 *       : { success: false, fieldErrors: response.errors, serverError: response.message }
 *   },
 *   onAsyncValidate: {
 *     email: async (email) => {
 *       const response = await fetch('/api/validate/email', {
 *         method: 'POST',
 *         body: JSON.stringify({ email }),
 *       })
 *       const result = await response.json()
 *       return result.available ? undefined : result.message
 *     },
 *   },
 * })
 *
 * return (
 *   <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
 *     <input
 *       value={form.state.values.email}
 *       onChange={(e) => form.setFieldValue('email', e.target.value)}
 *     />
 *     {getFieldError('email') && <span>{getFieldError('email')}</span>}
 *     <button type="submit" disabled={isSubmitting}>Submit</button>
 *   </form>
 * )
 * ```
 */
export function useFormState<T>({
  defaultValues,
  schema,
  onSubmit,
  onAsyncValidate = {},
  onError,
}: UseFormStateConfig<T>): UseFormStateReturn<T> {
  const form = useTanstackForm<T, ValidatorAsync>({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const result = await onSubmit(value)

        // Handle server-side field errors
        if (!result.success && result.fieldErrors) {
          // Apply field errors from server
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            const fieldApi = form.getFieldInfo(field as keyof T)
            if (fieldApi) {
              fieldApi.instance?.setFieldMeta((prev) => ({
                ...prev,
                errors: errors,
              }))
            }
          })
        }

        // Handle server error
        if (!result.success && result.serverError) {
          throw new Error(result.serverError)
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        onError?.(errorMessage)
        throw error
      }
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: schema,
    },
  })

  // Add async validators for field-level validation
  if (Object.keys(onAsyncValidate).length > 0) {
    Object.entries(onAsyncValidate).forEach(([fieldName, validator]) => {
      const fieldApi = form.getFieldInfo(fieldName as keyof T)
      if (fieldApi) {
        fieldApi.instance?.setValidators({
          onChange: [async (value) => {
            try {
              const error = await validator(value)
              return error
            } catch (error) {
              return 'Validation error'
            }
          }],
        })
      }
    })
  }

  const isSubmitting = form.state.isSubmitting
  const isValidating = form.state.isValidating

  const fieldErrors = form.state.fieldMeta
    ? Object.entries(form.state.fieldMeta).reduce(
        (acc, [field, meta]) => {
          if (meta?.errors && meta.errors.length > 0) {
            acc[field] = meta.errors as string[]
          }
          return acc
        },
        {} as Record<string, string[]>,
      )
    : {}

  const submitError = form.state.errorMap?.onSubmit?.[0] ?? null

  const handleSubmit = async () => {
    try {
      await form.handleSubmit()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Form submission failed'
      onError?.(errorMessage)
    }
  }

  const getFieldError = (fieldName: string): string | undefined => {
    const meta = form.state.fieldMeta?.[fieldName]
    return meta?.errors?.[0] as string | undefined
  }

  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    form.setFieldValue(field as never, value as never)
  }

  const reset = () => {
    form.reset()
  }

  return {
    form,
    isSubmitting,
    isValidating,
    submitError,
    fieldErrors,
    handleSubmit,
    getFieldError,
    setFieldValue,
    reset,
  }
}
