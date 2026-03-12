import { AlertCircle } from 'lucide-react'

interface ConflictIndicatorProps {
  reason?: string
  severity?: 'warning' | 'error'
}

export function ConflictIndicator({
  reason = 'Scheduling conflict',
  severity = 'warning',
}: ConflictIndicatorProps) {
  const severityColor = severity === 'error' ? 'text-red-500' : 'text-orange-500'
  const severityBg = severity === 'error' ? 'bg-red-50' : 'bg-orange-50'
  const severityBorder =
    severity === 'error' ? 'border-red-200' : 'border-orange-200'

  return (
    <div
      className={`relative inline-block group cursor-help ${severityBg} ${severityBorder} border rounded px-1 py-0.5`}
    >
      <AlertCircle className={`w-4 h-4 ${severityColor}`} />
      {reason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {reason}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}
