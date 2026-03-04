import { InputHTMLAttributes } from 'react'
import { FieldValues, FieldPath, Controller, UseControllerProps } from 'react-hook-form'

interface RHFInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  label?: string
  error?: string
  helperText?: string
}

/**
 * React Hook Form controlled input component with validation support.
 *
 * @example
 * ```tsx
 * <RHFInput
 *   control={control}
 *   name="email"
 *   label="Email"
 *   type="email"
 *   placeholder="user@example.com"
 * />
 * ```
 */
export function RHFInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  error,
  helperText,
  ...inputProps
}: RHFInputProps<TFieldValues, TName> & UseControllerProps<TFieldValues, TName>) {
  const { control, name } = inputProps as UseControllerProps<TFieldValues, TName>

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
          <input
            {...field}
            id={name}
            {...inputProps}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
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
