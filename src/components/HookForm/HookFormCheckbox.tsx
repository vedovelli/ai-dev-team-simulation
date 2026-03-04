import { Controller, Control, FieldValues, Path } from 'react-hook-form'
import { HookFormField } from './HookFormField'

interface HookFormCheckboxProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label?: string
  required?: boolean
  disabled?: boolean
}

export function HookFormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  required = false,
  disabled = false,
}: HookFormCheckboxProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <HookFormField label={label} error={error} required={required}>
          <div className="flex items-center gap-2">
            <input
              {...field}
              id={name as string}
              type="checkbox"
              checked={field.value}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {label && <label htmlFor={name as string}>{label}</label>}
          </div>
        </HookFormField>
      )}
    />
  )
}
