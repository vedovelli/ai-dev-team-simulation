import { FieldValues, UseFormHandleSubmit, UseFormSetError } from 'react-hook-form'
import { useState, useCallback } from 'react'

interface UseFormSubmitOptions<TFieldValues extends FieldValues> {
  /** The handleSubmit function from useForm */
  handleSubmit: UseFormHandleSubmit<TFieldValues>
  /** Function to set field errors when backend validation fails */
  setError: UseFormSetError<TFieldValues>
  /** Callback when form submits successfully */
  onSuccess?: (data: TFieldValues) => void | Promise<void>
  /** Callback when form submission fails */
  onError?: (error: Error) => void | Promise<void>
}

interface UseFormSubmitReturn {
  /** Whether the form is currently submitting */
  isLoading: boolean
  /** Error message if submission failed */
  error: string | null
  /** Submit handler to attach to form element */
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => Promise<void>
  /** Clear the current error message */
  clearError: () => void
}

/**
 * Custom hook that handles form submission with loading states and error handling.
 * Provides consistent patterns for managing async form operations.
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { control, handleSubmit, setError } = useForm({
 *     defaultValues: { name: '', email: '' }
 *   })
 *
 *   const { isLoading, error, onSubmit } = useFormSubmit({
 *     handleSubmit,
 *     setError,
 *     onSuccess: async (data) => {
 *       await api.createUser(data)
 *       console.log('User created!')
 *     },
 *     onError: (error) => {
 *       console.error('Submission failed:', error)
 *     }
 *   })
 *
 *   return (
 *     <form onSubmit={onSubmit}>
 *       {error && <div className="error">{error}</div>}
 *       <button type="submit" disabled={isLoading}>
 *         {isLoading ? 'Saving...' : 'Save'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 */
export function useFormSubmit<TFieldValues extends FieldValues>({
  handleSubmit,
  setError,
  onSuccess,
  onError,
}: UseFormSubmitOptions<TFieldValues>): UseFormSubmitReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setErrorMessage] = useState<string | null>(null)

  const onSubmit = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      // Prevent default if called directly
      if (e instanceof Event) {
        e.preventDefault()
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        await handleSubmit(async (data) => {
          try {
            if (onSuccess) {
              await onSuccess(data)
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))

            // Handle backend validation errors that might include field-level errors
            if (error instanceof Error && 'fieldErrors' in error) {
              const fieldErrors = (error as any).fieldErrors as Record<string, string>
              Object.entries(fieldErrors).forEach(([field, message]) => {
                setError(field as any, {
                  type: 'manual',
                  message: String(message),
                })
              })
              setErrorMessage('Please fix the validation errors')
            } else {
              setErrorMessage(error.message || 'Form submission failed')
              if (onError) {
                await onError(error)
              }
            }

            throw error
          }
        })(e as any)
      } catch (err) {
        // Error is already handled in the catch block above
      } finally {
        setIsLoading(false)
      }
    },
    [handleSubmit, setError, onSuccess, onError],
  )

  const clearError = useCallback(() => {
    setErrorMessage(null)
  }, [])

  return {
    isLoading,
    error,
    onSubmit,
    clearError,
  }
}
