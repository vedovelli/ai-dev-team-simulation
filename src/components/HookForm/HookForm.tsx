import { ReactNode } from 'react'

interface HookFormProps {
  onSubmit?: (e: React.FormEvent) => void
  children: ReactNode
  className?: string
  submitLabel?: string
  isLoading?: boolean
}

export function HookForm({
  onSubmit,
  children,
  className = '',
  submitLabel = 'Submit',
  isLoading = false,
}: HookFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col gap-6 ${className}`}
    >
      {children}
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Loading...' : submitLabel}
      </button>
    </form>
  )
}
