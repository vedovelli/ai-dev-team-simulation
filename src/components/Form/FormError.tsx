import React from 'react'

/**
 * Props for FormError component
 */
interface FormErrorProps {
  /** Validation error message(s) to display */
  errors?: string | string[]
  /** CSS class name for styling */
  className?: string
  /** Whether to show error icon */
  showIcon?: boolean
  /** Callback when error is dismissed */
  onDismiss?: () => void
  /** Type of error display (inline or summary) */
  variant?: 'inline' | 'summary' | 'alert'
}

/**
 * FormError component for displaying validation errors
 *
 * Supports multiple error messages and different display variants
 *
 * @example
 * ```tsx
 * // Inline error display
 * <FormError errors={['Email is required', 'Invalid email format']} variant="inline" />
 *
 * // Summary error block
 * <FormError
 *   errors={formErrors}
 *   variant="summary"
 *   showIcon
 * />
 *
 * // Alert style with dismiss
 * <FormError
 *   errors="An error occurred"
 *   variant="alert"
 *   onDismiss={() => clearErrors()}
 * />
 * ```
 */
export const FormError: React.FC<FormErrorProps> = ({
  errors,
  className = '',
  showIcon = true,
  onDismiss,
  variant = 'inline',
}) => {
  // Return null if no errors
  if (!errors || (Array.isArray(errors) && errors.length === 0)) {
    return null
  }

  // Normalize errors to array
  const errorList = Array.isArray(errors) ? errors : [errors]

  if (variant === 'inline') {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        {showIcon && <span className="mr-2">⚠</span>}
        <span>{errorList[0]}</span>
      </div>
    )
  }

  if (variant === 'summary') {
    return (
      <div className={`rounded-md bg-red-50 p-4 ${className}`}>
        <div className="flex">
          {showIcon && (
            <div className="mr-3 flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {errorList.length > 1 ? `${errorList.length} errors found` : 'Validation error'}
            </h3>
            {errorList.length > 0 && (
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-inside space-y-1">
                  {errorList.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="ml-auto inline-flex text-red-400 hover:text-red-500"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'alert') {
    return (
      <div className={`rounded-lg border-l-4 border-red-500 bg-red-50 p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-red-800">
              {errorList.length === 1
                ? errorList[0]
                : `${errorList.length} validation errors`}
            </p>
            {errorList.length > 1 && (
              <ul className="mt-2 list-inside space-y-1 text-sm text-red-700">
                {errorList.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            )}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="ml-auto flex-shrink-0 text-red-400 hover:text-red-500"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
