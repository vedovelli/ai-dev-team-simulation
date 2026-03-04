import { Controller, Control, FieldValues, Path } from 'react-hook-form'
import { HookFormField } from './HookFormField'

interface HookFormTextareaProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
}

export function HookFormTextarea<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
}: HookFormTextareaProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <HookFormField label={label} error={error} required={required}>
          <textarea
            {...field}
            id={name as string}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 resize-vertical"
          />
        </HookFormField>
      )}
    />
  )
}
