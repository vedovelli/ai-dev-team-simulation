import { useCallback, useState, useEffect, useRef } from 'react'
import { FieldPath, FieldValues, UseControllerProps, UseControllerReturn, useController } from 'react-hook-form'

/**
 * Validation error type
 */
export interface ValidationError {
  message: string
  field?: string
}

/**
 * Configuration for async validators
 */
export interface AsyncValidatorConfig {
  debounce?: number // milliseconds to debounce async validation (default: 300)
  endpoint?: string // MSW endpoint for validation
}

/**
 * Extended controller props with async validation
 */
export interface UseFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<UseControllerProps<TFieldValues, TName>, 'rules'> {
  rules?: UseControllerProps<TFieldValues, TName>['rules']
  asyncValidate?: (value: any) => Promise<string | undefined>
  asyncValidatorConfig?: AsyncValidatorConfig
}

/**
 * Extended return type for useFormField with async validation
 */
export interface UseFormFieldReturn<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<UseControllerReturn<TFieldValues, TName>, 'fieldState'> {
  field: ReturnType<typeof useController>['field']
  fieldState: ReturnType<typeof useController>['fieldState'] & {
    asyncError?: string
  }
  hasError: boolean
  errorMessage?: string
  isValidating: boolean
}

/**
 * Custom hook that wraps React Hook Form's useController for consistent field rendering.
 * Provides field state, error information, async validation support, and helper functions.
 *
 * Features:
 * - Sync validation via React Hook Form rules
 * - Async validation with configurable debouncing
 * - Proper error state management
 * - Performance optimized with debouncing to prevent excessive API calls
 *
 * @template TFieldValues - The form's data structure
 * @template TName - The field name (must be a valid path in TFieldValues)
 *
 * @example
 * ```tsx
 * // Basic usage with sync validation
 * function EmailField() {
 *   const { field, fieldState } = useFormField({
 *     name: 'email',
 *     rules: { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } }
 *   })
 *
 *   return (
 *     <div>
 *       <label>{field.name}</label>
 *       <input {...field} type="email" />
 *       {fieldState.error && <span className="error">{fieldState.error.message}</span>}
 *     </div>
 *   )
 * }
 *
 * // With async validation
 * function UsernameField() {
 *   const { field, fieldState, isValidating } = useFormField({
 *     name: 'username',
 *     rules: {
 *       required: 'Username is required',
 *       minLength: { value: 3, message: 'Min 3 characters' }
 *     },
 *     asyncValidate: async (value) => {
 *       const response = await fetch('/api/validate/username', {
 *         method: 'POST',
 *         body: JSON.stringify({ username: value })
 *       })
 *       const result = await response.json()
 *       return result.available ? undefined : 'Username is taken'
 *     },
 *     asyncValidatorConfig: { debounce: 500 }
 *   })
 *
 *   return (
 *     <div>
 *       <label>Username</label>
 *       <input {...field} />
 *       {fieldState.error && <span className="error">{fieldState.error.message}</span>}
 *       {fieldState.asyncError && <span className="error">{fieldState.asyncError}</span>}
 *       {isValidating && <span className="validating">Checking availability...</span>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: UseFormFieldProps<TFieldValues, TName>,
): UseFormFieldReturn<TFieldValues, TName> {
  const { asyncValidate, asyncValidatorConfig = {}, ...controllerProps } = props
  const { debounce = 300 } = asyncValidatorConfig

  const { field, fieldState } = useController(controllerProps as UseControllerProps<TFieldValues, TName>)
  const [isValidating, setIsValidating] = useState(false)
  const [asyncError, setAsyncError] = useState<string | undefined>()
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Validate field asynchronously
  const validateAsync = useCallback(
    async (value: any) => {
      if (!asyncValidate) return

      setIsValidating(true)
      try {
        const error = await asyncValidate(value)
        setAsyncError(error)
      } catch (error) {
        setAsyncError('Validation error')
      } finally {
        setIsValidating(false)
      }
    },
    [asyncValidate],
  )

  // Set up debounced async validation
  useEffect(() => {
    if (!asyncValidate) return

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      validateAsync(field.value)
    }, debounce)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [field.value, asyncValidate, debounce, validateAsync])

  const errorMessage = fieldState.error?.message || asyncError

  return {
    field,
    fieldState: {
      ...fieldState,
      asyncError,
    },
    hasError: !!fieldState.error || !!asyncError,
    errorMessage,
    isValidating,
  }
}
