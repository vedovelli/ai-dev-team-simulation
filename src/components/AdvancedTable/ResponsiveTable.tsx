import { ReactNode } from 'react'

interface ResponsiveTableProps {
  children: ReactNode
  isMobile?: boolean
}

/**
 * Responsive wrapper for AdvancedTable
 * Shows table on desktop, switches to card view on mobile
 */
export function ResponsiveTable({ children, isMobile = false }: ResponsiveTableProps) {
  if (isMobile) {
    return (
      <div className="space-y-4">
        {children}
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  title: string
  fields: Array<{
    label: string
    value: ReactNode
  }>
}

export function ResponsiveCard({ title, fields }: ResponsiveCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="space-y-2">
        {fields.map((field, idx) => (
          <div key={idx} className="flex justify-between items-start gap-2">
            <span className="text-sm font-medium text-slate-600 flex-shrink-0">
              {field.label}:
            </span>
            <span className="text-sm text-slate-900 text-right">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
