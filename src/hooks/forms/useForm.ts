import { useForm as useTanstackForm, UseFormOptions } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { ZodSchema } from 'zod'

interface UseFormOptions<T> {
  defaultValues: T
  schema: ZodSchema
  onSubmit: (data: T) => Promise<void>
}

export function useForm<T>({
  defaultValues,
  schema,
  onSubmit,
}: UseFormOptions<T>) {
  const form = useTanstackForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: schema,
    },
  })

  return form
}
