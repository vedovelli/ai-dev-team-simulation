import { FieldPath, FieldValues, UseControllerProps, UseControllerReturn, useController } from 'react-hook-form'

/**
 * Custom hook that wraps React Hook Form's useController for consistent field rendering.
 * Provides field state, error information, and helper functions for form field integration.
 *
 * @template TFieldValues - The form's data structure
 * @template TName - The field name (must be a valid path in TFieldValues)
 *
 * @example
 * ```tsx
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
 * ```
 */
export function useFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: UseControllerProps<TFieldValues, TName>,
): UseControllerReturn<TFieldValues, TName> & {
  hasError: boolean
  errorMessage?: string
} {
  const { field, fieldState } = useController(props)

  return {
    field,
    fieldState,
    hasError: !!fieldState.error,
    errorMessage: fieldState.error?.message,
  }
}
