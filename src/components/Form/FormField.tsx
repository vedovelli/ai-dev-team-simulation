import { FieldApi } from '@tanstack/react-form'

interface FormFieldProps {
  field: FieldApi<any, any, any, any>
  children: React.ReactNode
  label?: string
  helpText?: string
}

export function FormField({ field, children, label, helpText }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={field.name} className="text-sm font-medium">
          {label}
        </label>
      )}
      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
      {children}
      {field.state.meta.errors.length > 0 && (
        <div className="text-sm text-red-600">
          {field.state.meta.errors[0]}
        </div>
      )}
    </div>
  )
}
