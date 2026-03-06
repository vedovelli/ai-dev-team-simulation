/**
 * Form hooks and utilities
 *
 * Provides reusable abstraction layers for form handling:
 * - React Hook Form: useFormField, useFormSubmit, useValidation, validationRules, ExampleForm
 * - TanStack Form: useForm (generic), useLoginForm, useFilterForm, useCrudForm
 *
 * React Hook Form is used for traditional form patterns with fine-grained control.
 * TanStack Form is used for more complex patterns like validation, async checks, and CRUD operations.
 *
 * Documentation: see docs/guides/VALIDATED_FORM_INFRASTRUCTURE.md
 *
 * @example
 * ```tsx
 * // TanStack Form example
 * import { useLoginForm } from '@/hooks/forms'
 *
 * function LoginPage() {
 *   const form = useLoginForm({
 *     onSubmit: async (data) => {
 *       await api.login(data)
 *     }
 *   })
 *
 *   return (
 *     <form
 *       onSubmit={(e) => {
 *         e.preventDefault()
 *         form.handleSubmit()
 *       }}
 *     >
 *       {form.state.fieldMeta('email')?.errors?.[0] && (
 *         <span>{form.state.fieldMeta('email').errors[0]}</span>
 *       )}
 *       <input
 *         type="email"
 *         value={form.state.values.email}
 *         onChange={(e) =>
 *           form.setFieldValue('email', e.target.value)
 *         }
 *       />
 *       <button type="submit">Login</button>
 *     </form>
 *   )
 * }
 * ```
 */

// React Hook Form exports
export { useFormField } from './useFormField'
export { useFormSubmit } from './useFormSubmit'
export { useValidation, validationRules } from './useValidation'
export { ExampleForm } from './ExampleForm'

// TanStack Form exports
export { useForm } from './useForm'
export { useLoginForm } from './useLoginForm'
export { useFilterForm } from './useFilterForm'
export { useCrudForm } from './useCrudForm'
export { useFormState } from './useFormState'

// Form Validation Pattern exports
export { useFormValidation } from './useFormValidation'

export type { UseFormSubmitReturn } from './useFormSubmit'
export type { LoginFormData } from './useLoginForm'
export type { FilterFormData } from './useFilterForm'
export type { CrudFormMode } from './useCrudForm'
export type { RegistrationFormData } from './examples/RegistrationFormExample'
export type {
  SyncValidator,
  AsyncValidator,
  FieldValidation,
  FormValidationState,
  UseFormValidationOptions,
  FormValidationReturn,
} from './useFormValidation'
export type {
  FieldValidationError,
  FormSubmissionResult,
  UseFormStateConfig,
  UseFormStateReturn,
} from './useFormState'
