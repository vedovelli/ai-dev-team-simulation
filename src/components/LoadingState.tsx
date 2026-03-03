interface LoadingStateProps {
  title?: string
  message?: string
}

export function LoadingState({ title = 'Loading', message = 'Please wait...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 animate-spin">
        <div className="h-8 w-8 border-4 border-slate-400 border-t-slate-100 rounded-full"></div>
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-400">{message}</p>
    </div>
  )
}
