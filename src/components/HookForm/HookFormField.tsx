import { ReactNode } from 'react'
import { FieldError } from 'react-hook-form'

interface HookFormFieldProps {
  label?: string
  error?: FieldError
  children: ReactNode
  required?: boolean
}

export function HookFormField({
  label,
  error,
  children,
  required = false,
}: HookFormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <div className="text-sm text-red-600">{error.message}</div>}
    </div>
  )
}
