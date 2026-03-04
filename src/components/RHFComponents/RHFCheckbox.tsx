import { InputHTMLAttributes } from 'react'
import { FieldValues, FieldPath, Controller, UseControllerProps } from 'react-hook-form'

interface RHFCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'> {
  label?: string
  error?: string
  helperText?: string
}

/**
 * React Hook Form controlled checkbox component with validation support.
 *
 * @example
 * ```tsx
 * <RHFCheckbox
 *   control={control}
 *   name="agreeToTerms"
 *   label="I agree to the terms"
 * />
 * ```
 */
export function RHFCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  error,
  helperText,
  ...checkboxProps
}: RHFCheckboxProps<TFieldValues, TName> & UseControllerProps<TFieldValues, TName>) {
  const { control, name } = checkboxProps as UseControllerProps<TFieldValues, TName>

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error: fieldError } }) => (
        <div>
          <div className="flex items-center">
            <input
              {...field}
              id={name}
              type="checkbox"
              checked={field.value || false}
              {...checkboxProps}
              className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 ${
                fieldError ? 'border-red-500' : ''
              }`}
            />
            {label && (
              <label htmlFor={name} className="ml-2 block text-sm text-gray-700">
                {label}
              </label>
            )}
          </div>
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
