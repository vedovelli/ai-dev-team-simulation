import { InputHTMLAttributes } from 'react'
import { FieldValues, FieldPath, Controller, UseControllerProps } from 'react-hook-form'

export interface RHFRadioOption {
  value: string | number
  label: string
  description?: string
}

interface RHFRadioProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'> {
  label?: string
  error?: string
  helperText?: string
  options: RHFRadioOption[]
}

/**
 * React Hook Form controlled radio button group component with validation support.
 *
 * @example
 * ```tsx
 * <RHFRadio
 *   control={control}
 *   name="priority"
 *   label="Priority Level"
 *   options={[
 *     { value: 'low', label: 'Low' },
 *     { value: 'medium', label: 'Medium' },
 *     { value: 'high', label: 'High' }
 *   ]}
 * />
 * ```
 */
export function RHFRadio<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  error,
  helperText,
  options,
  ...radioProps
}: RHFRadioProps<TFieldValues, TName> & UseControllerProps<TFieldValues, TName>) {
  const { control, name } = radioProps as UseControllerProps<TFieldValues, TName>

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error: fieldError } }) => (
        <fieldset>
          {label && (
            <legend className="block text-sm font-medium text-gray-700 mb-3">
              {label}
            </legend>
          )}
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-start">
                <input
                  {...field}
                  id={`${name}-${option.value}`}
                  type="radio"
                  value={option.value}
                  checked={field.value === option.value}
                  onChange={() => field.onChange(option.value)}
                  onBlur={field.onBlur}
                  {...radioProps}
                  className={`h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 ${
                    fieldError ? 'border-red-500' : ''
                  }`}
                  aria-label={option.label}
                />
                <div className="ml-3 flex flex-col">
                  <label
                    htmlFor={`${name}-${option.value}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    {option.label}
                  </label>
                  {option.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {fieldError && (
            <p className="mt-2 text-sm text-red-600">{fieldError.message}</p>
          )}
          {helperText && !fieldError && (
            <p className="mt-2 text-sm text-gray-500">{helperText}</p>
          )}
        </fieldset>
      )}
    />
  )
}
