import { useRef, useEffect } from 'react'
import { FieldApi } from '@tanstack/react-form'
import { FormField } from './FormField'

interface CheckboxProps {
  field: FieldApi<any, any, any, any>
  label?: string
  description?: string
  indeterminate?: boolean
}

export function Checkbox({ field, label, description, indeterminate = false }: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <FormField field={field} label="">
      <div className="flex items-start gap-2">
        <input
          ref={inputRef}
          id={field.name}
          name={field.name}
          type="checkbox"
          checked={field.state.value || false}
          onChange={(e) => field.handleChange(e.target.checked)}
          onBlur={field.handleBlur}
          className="mt-1 h-4 w-4 rounded border border-gray-300 text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex flex-col gap-1">
          {label && (
            <label htmlFor={field.name} className="text-sm font-medium">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-gray-600">{description}</p>
          )}
          {field.state.meta.errors.length > 0 && (
            <div className="text-sm text-red-600">
              {field.state.meta.errors[0]}
            </div>
          )}
        </div>
      </div>
    </FormField>
  )
}
