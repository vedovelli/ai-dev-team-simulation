import { useForm, FormState } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { ZodSchema } from 'zod'

/**
 * CRUD form mode type
 */
export type CrudFormMode = 'create' | 'update'

interface UseCrudFormOptions<T> {
  /** The validation schema (Zod) */
  schema: ZodSchema
  /** Initial values for create mode */
  defaultValues: T
  /** Initial values for update mode (when editing) */
  initialData?: T
  /** Mode: create or update */
  mode?: CrudFormMode
  /** Callback when form is submitted */
  onSubmit: (data: T, mode: CrudFormMode) => Promise<void>
  /** Called when switching between modes */
  onModeChange?: (mode: CrudFormMode) => void
}

/**
 * Custom hook for CRUD forms with create/update mode handling
 * Handles field-level validation and integrates with MSW mock responses
 *
 * @example
 * ```tsx
 * function UserForm({ userId }: { userId?: string }) {
 *   const [mode, setMode] = React.useState<CrudFormMode>(
 *     userId ? 'update' : 'create'
 *   )
 *
 *   const form = useCrudForm({
 *     schema: userSchema,
 *     defaultValues: { name: '', email: '' },
 *     initialData: userId ? user : undefined,
 *     mode,
 *     onSubmit: async (data, mode) => {
 *       if (mode === 'create') {
 *         await api.createUser(data)
 *       } else {
 *         await api.updateUser(userId, data)
 *       }
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
 *       <input
 *         type="text"
 *         value={form.state.values.name}
 *         onChange={(e) =>
 *           form.setFieldValue('name', e.target.value)
 *         }
 *       />
 *       <button type="submit">
 *         {mode === 'create' ? 'Create' : 'Update'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 */
export function useCrudForm<T extends Record<string, any>>({
  schema,
  defaultValues,
  initialData,
  mode = 'create',
  onSubmit,
  onModeChange,
}: UseCrudFormOptions<T>) {
  // Use initialData for update mode, otherwise use defaultValues
  const initialValues = mode === 'update' && initialData ? initialData : defaultValues

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value as T, mode)
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: schema,
      onBlur: schema,
    },
  })

  // Provide mode information
  const formState = form.state as FormState<T> & {
    mode: CrudFormMode
    isDirty: boolean
    isNew: boolean
  }

  // Extend form state with mode information
  Object.defineProperty(formState, 'mode', {
    value: mode,
    writable: false,
    enumerable: true,
  })

  Object.defineProperty(formState, 'isNew', {
    value: mode === 'create',
    writable: false,
    enumerable: true,
  })

  // Check if form has been modified
  const isDirty =
    JSON.stringify(form.state.values) !== JSON.stringify(initialValues)

  Object.defineProperty(formState, 'isDirty', {
    value: isDirty,
    writable: false,
    enumerable: true,
  })

  return {
    ...form,
    state: formState,
  }
}
