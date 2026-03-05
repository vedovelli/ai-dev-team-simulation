import { useCallback, useMemo, useState } from 'react'
import { ZodSchema } from 'zod'

/**
 * Validator function type for sync validation
 */
export type SyncValidator<T> = (value: T) => true | string

/**
 * Validator function type for async validation with debouncing
 */
export type AsyncValidator<T> = (value: T) => Promise<true | string>

/**
 * Field-level validation configuration
 */
export interface FieldValidation<T = any> {
  sync?: SyncValidator<T>[]
  async?: AsyncValidator<T>[]
  debounce?: number // milliseconds to debounce async validators
}

/**
 * Form validation state
 */
export interface FormValidationState {
  errors: Record<string, string[]>
  isValidating: Record<string, boolean>
  isDirty: Record<string, boolean>
}

/**
 * useFormValidation hook options
 */
export interface UseFormValidationOptions<T extends Record<string, any>> {
  schema?: ZodSchema
  validators?: Partial<Record<keyof T, FieldValidation>>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnSubmit?: boolean
}

/**
 * useFormValidation hook return type
 */
export interface FormValidationReturn<T extends Record<string, any>> {
  state: FormValidationState
  validateField: (fieldName: keyof T, value: any) => Promise<boolean>
  validateForm: (formValues: T) => Promise<boolean>
  setFieldError: (fieldName: string, errors: string[]) => void
  clearFieldError: (fieldName: string) => void
  clearErrors: () => void
  getFieldErrors: (fieldName: string) => string[]
  isFieldValidating: (fieldName: string) => boolean
  isFieldDirty: (fieldName: string) => boolean
  markFieldDirty: (fieldName: string) => void
}

/**
 * Hook for managing form validation with support for sync and async validators
 *
 * @example
 * ```tsx
 * const { state, validateField, validateForm, getFieldErrors } = useFormValidation({
 *   validators: {
 *     email: {
 *       sync: [
 *         (value) => !value ? 'Email is required' : true,
 *         (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : 'Invalid email format'
 *       ],
 *       async: [
 *         async (value) => {
 *           const exists = await checkEmailExists(value)
 *           return !exists ? true : 'Email already registered'
 *         }
 *       ],
 *       debounce: 500
 *     }
 *   }
 * })
 * ```
 */
export function useFormValidation<T extends Record<string, any>>(
  options: UseFormValidationOptions<T> = {},
): FormValidationReturn<T> {
  const { schema, validators = {}, validateOnChange = true } = options

  const [state, setState] = useState<FormValidationState>({
    errors: {},
    isValidating: {},
    isDirty: {},
  })

  // Debounce timers for async validators
  const debounceTimers = useMemo(() => new Map<string, NodeJS.Timeout>(), [])

  /**
   * Run sync validators for a field
   */
  const runSyncValidators = useCallback(
    (fieldName: string, value: any): string[] => {
      const fieldValidators = validators[fieldName as keyof T]
      if (!fieldValidators?.sync) return []

      const errors: string[] = []
      for (const validator of fieldValidators.sync) {
        const result = validator(value)
        if (result !== true) {
          errors.push(result)
        }
      }
      return errors
    },
    [validators],
  )

  /**
   * Run async validators for a field with debouncing
   */
  const runAsyncValidators = useCallback(
    async (fieldName: string, value: any): Promise<string[]> => {
      const fieldValidators = validators[fieldName as keyof T]
      if (!fieldValidators?.async) return []

      return Promise.all(fieldValidators.async.map((validator) => validator(value))).then(
        (results) =>
          results
            .filter((result) => result !== true)
            .map((result) => (typeof result === 'string' ? result : 'Validation failed')),
      )
    },
    [validators],
  )

  /**
   * Validate a single field with sync and async validators
   */
  const validateField = useCallback(
    async (fieldName: keyof T, value: any): Promise<boolean> => {
      const fieldKey = String(fieldName)

      // Run sync validators first
      const syncErrors = runSyncValidators(fieldKey, value)
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [fieldKey]: syncErrors },
      }))

      if (syncErrors.length > 0) {
        return false
      }

      // Clear previous debounce timer if exists
      const existingTimer = debounceTimers.get(fieldKey)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Run async validators with debouncing
      const debounceDelay = validators[fieldName]?.debounce ?? 300

      return new Promise((resolve) => {
        const timer = setTimeout(async () => {
          setState((prev) => ({
            ...prev,
            isValidating: { ...prev.isValidating, [fieldKey]: true },
          }))

          const asyncErrors = await runAsyncValidators(fieldKey, value)

          setState((prev) => ({
            ...prev,
            errors: { ...prev.errors, [fieldKey]: asyncErrors },
            isValidating: { ...prev.isValidating, [fieldKey]: false },
          }))

          debounceTimers.delete(fieldKey)
          resolve(asyncErrors.length === 0)
        }, debounceDelay)

        debounceTimers.set(fieldKey, timer)
      })
    },
    [runSyncValidators, runAsyncValidators, validators, debounceTimers],
  )

  /**
   * Validate entire form using validators and/or schema
   */
  const validateForm = useCallback(
    async (formValues: T): Promise<boolean> => {
      const newErrors: Record<string, string[]> = {}
      const validationPromises: Promise<boolean>[] = []

      // Validate fields with custom validators
      for (const fieldName of Object.keys(validators)) {
        const value = formValues[fieldName as keyof T]
        validationPromises.push(validateField(fieldName as keyof T, value))
      }

      // If schema provided, validate against it
      if (schema) {
        try {
          schema.parse(formValues)
        } catch (error: any) {
          if (error.errors && Array.isArray(error.errors)) {
            error.errors.forEach((err: any) => {
              const path = err.path.join('.')
              if (!newErrors[path]) {
                newErrors[path] = []
              }
              newErrors[path].push(err.message)
            })
          }
        }
      }

      // Wait for all validations to complete
      const results = await Promise.all(validationPromises)
      const customValidationsPassed = results.every((result) => result === true)

      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, ...newErrors },
      }))

      return customValidationsPassed && Object.keys(newErrors).length === 0
    },
    [validateField, schema, validators],
  )

  const setFieldError = useCallback((fieldName: string, errors: string[]) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [fieldName]: errors },
    }))
  }, [])

  const clearFieldError = useCallback((fieldName: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [fieldName]: [] },
    }))
  }, [])

  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
    }))
  }, [])

  const getFieldErrors = useCallback((fieldName: string): string[] => {
    return state.errors[fieldName] || []
  }, [state.errors])

  const isFieldValidating = useCallback((fieldName: string): boolean => {
    return state.isValidating[fieldName] || false
  }, [state.isValidating])

  const isFieldDirty = useCallback((fieldName: string): boolean => {
    return state.isDirty[fieldName] || false
  }, [state.isDirty])

  const markFieldDirty = useCallback((fieldName: string) => {
    setState((prev) => ({
      ...prev,
      isDirty: { ...prev.isDirty, [fieldName]: true },
    }))
  }, [])

  return {
    state,
    validateField,
    validateForm,
    setFieldError,
    clearFieldError,
    clearErrors,
    getFieldErrors,
    isFieldValidating,
    isFieldDirty,
    markFieldDirty,
  }
}
