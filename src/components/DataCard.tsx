import { ReactNode } from 'react'

interface DataCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function DataCard({ title, children, className = '' }: DataCardProps) {
  return (
    <div className={`bg-slate-800 rounded-lg p-6 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
      {children}
    </div>
  )
}
