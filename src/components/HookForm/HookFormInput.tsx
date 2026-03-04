import { Controller, Control, FieldValues, Path } from 'react-hook-form'
import { HookFormField } from './HookFormField'

interface HookFormInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number'
  required?: boolean
  disabled?: boolean
  min?: string | number
  step?: string | number
}

export function HookFormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  min,
  step,
}: HookFormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <HookFormField label={label} error={error} required={required}>
          <input
            {...field}
            id={name as string}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            step={step}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </HookFormField>
      )}
    />
  )
}
