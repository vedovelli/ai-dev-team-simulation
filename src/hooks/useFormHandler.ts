import { useForm, UseFormProps, FieldValues, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodSchema } from 'zod'

interface UseFormHandlerProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema?: ZodSchema
  onSubmit: (data: T) => void | Promise<void>
}

/**
 * Custom hook wrapper for React Hook Form with Zod validation support.
 * Provides a consistent form handling pattern across the application.
 *
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useFormHandler({
 *   schema: userSchema,
 *   defaultValues: { name: '', email: '' },
 *   onSubmit: async (data) => {
 *     await submitForm(data)
 *   }
 * })
 * ```
 */
export function useFormHandler<T extends FieldValues>({
  schema,
  onSubmit,
  ...props
}: UseFormHandlerProps<T>): UseFormReturn<T> & { isSubmitting: boolean } {
  const form = useForm<T>({
    ...(schema && { resolver: zodResolver(schema) }),
    ...props,
  })

  const handleSubmit = form.handleSubmit(onSubmit)

  return {
    ...form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
  }
}
