import { ReactNode } from 'react'

interface TableCellProps {
  children: ReactNode
  isHeader?: boolean
  isSortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onClick?: () => void
  className?: string
  align?: 'left' | 'center' | 'right'
  width?: string | number
}

export function TableCell({
  children,
  isHeader = false,
  isSortable = false,
  sortDirection = null,
  onClick,
  className = '',
  align = 'left',
  width,
}: TableCellProps) {
  const Component = isHeader ? 'th' : 'td'

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align]

  const baseClasses = `
    px-4 py-3
    ${alignClass}
    ${width ? `w-[${width}]` : ''}
  `

  const headerClasses = `
    bg-slate-100
    border-b border-slate-300
    font-semibold
    text-slate-700
    text-sm
  `

  const cellClasses = `
    text-slate-900
    text-sm
  `

  const sortableClasses = isSortable && isHeader ? 'cursor-pointer select-none hover:bg-slate-200' : ''
  const ariaSort = isHeader && isSortable
    ? sortDirection === 'asc'
      ? 'ascending'
      : sortDirection === 'desc'
        ? 'descending'
        : 'none'
    : undefined

  return (
    <Component
      className={`
        ${baseClasses}
        ${isHeader ? headerClasses : cellClasses}
        ${sortableClasses}
        ${className}
      `}
      onClick={isSortable && isHeader ? onClick : undefined}
      role={isHeader ? 'columnheader' : 'gridcell'}
      aria-sort={ariaSort}
    >
      {isHeader && isSortable && sortDirection ? (
        <div className="flex items-center gap-2">
          {children}
          <span className="text-xs font-normal">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        </div>
      ) : isHeader && isSortable ? (
        <div className="flex items-center gap-2">
          {children}
          <span className="text-xs font-normal opacity-40">⇅</span>
        </div>
      ) : (
        children
      )}
    </Component>
  )
}
