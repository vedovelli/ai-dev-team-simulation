import { SelectHTMLAttributes } from 'react'
import { FieldValues, FieldPath, Controller, UseControllerProps } from 'react-hook-form'

interface RHFSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  label?: string
  error?: string
  helperText?: string
  options: Array<{ value: string | number; label: string }>
}

/**
 * React Hook Form controlled select component with validation support.
 *
 * @example
 * ```tsx
 * <RHFSelect
 *   control={control}
 *   name="status"
 *   label="Status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' }
 *   ]}
 * />
 * ```
 */
export function RHFSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  error,
  helperText,
  options,
  ...selectProps
}: RHFSelectProps<TFieldValues, TName> & UseControllerProps<TFieldValues, TName>) {
  const { control, name } = selectProps as UseControllerProps<TFieldValues, TName>

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error: fieldError } }) => (
        <div>
          {label && (
            <label
              htmlFor={name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {label}
            </label>
          )}
          <select
            {...field}
            id={name}
            {...selectProps}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldError ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError.message}</p>
          )}
          {helperText && !fieldError && (
            <p className="mt-1 text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    />
  )
}
