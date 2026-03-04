import { TextareaHTMLAttributes } from 'react'
import { FieldValues, FieldPath, Controller, UseControllerProps } from 'react-hook-form'

interface RHFTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  label?: string
  error?: string
  helperText?: string
}

/**
 * React Hook Form controlled textarea component with validation support.
 *
 * @example
 * ```tsx
 * <RHFTextarea
 *   control={control}
 *   name="description"
 *   label="Description"
 *   placeholder="Enter description"
 *   rows={4}
 * />
 * ```
 */
export function RHFTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  error,
  helperText,
  ...textareaProps
}: RHFTextareaProps<TFieldValues, TName> & UseControllerProps<TFieldValues, TName>) {
  const { control, name } = textareaProps as UseControllerProps<TFieldValues, TName>

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
          <textarea
            {...field}
            id={name}
            {...textareaProps}
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
