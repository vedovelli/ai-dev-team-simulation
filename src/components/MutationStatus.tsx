import { ReactNode } from 'react'

export interface MutationStatusProps {
  isLoading?: boolean
  isSuccess?: boolean
  isError?: boolean
  successMessage?: string
  children?: ReactNode
}

export function MutationStatus({
  isLoading = false,
  isSuccess = false,
  isError = false,
  successMessage = 'Operation completed successfully!',
  children,
}: MutationStatusProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-blue-700 text-sm font-medium">Processing...</p>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-700 text-sm font-medium">{successMessage}</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return null
  }

  return children || null
}
