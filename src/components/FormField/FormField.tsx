import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  children: ReactNode
}

export const FormField = ({ label, error, children }: FormFieldProps) => (
  <div>
    <label className="block text-sm font-medium mb-2">{label}</label>
    {children}
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
)
