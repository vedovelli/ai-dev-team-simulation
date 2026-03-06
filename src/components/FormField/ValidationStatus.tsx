/**
 * ValidationStatus Component
 * Displays validation state (validating, valid, invalid) with loading spinner
 * and icons to provide visual feedback during form validation
 */

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid'

interface ValidationStatusProps {
  state: ValidationState
  showIcon?: boolean
}

export const ValidationStatus = ({ state, showIcon = true }: ValidationStatusProps) => {
  if (state === 'idle') return null

  return (
    <div className="flex items-center gap-2 mt-2">
      {state === 'validating' && (
        <>
          <span
            className="inline-block h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="Validating"
          />
          <span className="text-sm text-blue-500 font-medium">Validating...</span>
        </>
      )}

      {state === 'valid' && showIcon && (
        <>
          <span className="inline-block h-4 w-4 text-emerald-500">✓</span>
          <span className="text-sm text-emerald-500 font-medium">Valid</span>
        </>
      )}

      {state === 'invalid' && showIcon && (
        <>
          <span className="inline-block h-4 w-4 text-red-500">✕</span>
          <span className="text-sm text-red-500 font-medium">Invalid</span>
        </>
      )}
    </div>
  )
}
