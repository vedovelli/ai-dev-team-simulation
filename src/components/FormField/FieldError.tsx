/**
 * FieldError Component
 * Displays inline validation errors for form fields with accessibility features
 * and smooth animations
 */

interface FieldErrorProps {
  error?: string
  fieldName?: string
}

export const FieldError = ({ error, fieldName }: FieldErrorProps) => {
  if (!error) return null

  return (
    <div
      role="alert"
      aria-describedby={fieldName ? `error-${fieldName}` : undefined}
      className="mt-2 text-red-500 text-sm font-medium animate-fade-in"
    >
      <span id={fieldName ? `error-${fieldName}` : undefined} className="flex items-center gap-1">
        <span className="inline-block">⚠</span>
        {error}
      </span>
    </div>
  )
}
