interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mb-4 inline-flex h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}
