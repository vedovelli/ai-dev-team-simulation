import { Controller, Control, FieldValues, Path } from 'react-hook-form'
import { HookFormField } from './HookFormField'

interface HookFormSelectProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label?: string
  required?: boolean
  disabled?: boolean
  options: Array<{ value: string | number; label: string }>
  placeholder?: string
}

export function HookFormSelect<T extends FieldValues>({
  control,
  name,
  label,
  required = false,
  disabled = false,
  options,
  placeholder,
}: HookFormSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <HookFormField label={label} error={error} required={required}>
          <select
            {...field}
            id={name as string}
            disabled={disabled}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </HookFormField>
      )}
    />
  )
}
