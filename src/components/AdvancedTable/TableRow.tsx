import { ReactNode } from 'react'

interface TableRowProps {
  children: ReactNode
  isSelected?: boolean
  isEven?: boolean
  onSelect?: () => void
  rowIndex?: number
  pageIndex?: number
  pageSize?: number
  className?: string
  style?: React.CSSProperties
}

export function TableRow({
  children,
  isSelected = false,
  isEven = false,
  onSelect,
  rowIndex,
  pageIndex = 0,
  pageSize = 10,
  className = '',
  style,
}: TableRowProps) {
  const ariaRowIndex =
    rowIndex !== undefined ? pageIndex * pageSize + rowIndex + 2 : undefined

  return (
    <tr
      className={`
        border-b border-slate-200
        transition-colors
        ${isEven ? 'bg-slate-50' : 'bg-white'}
        ${isSelected ? 'bg-blue-100' : 'hover:bg-blue-50'}
        ${onSelect ? 'cursor-pointer' : ''}
        focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-500
        ${className}
      `}
      onClick={onSelect}
      role="row"
      aria-rowindex={ariaRowIndex}
      tabIndex={isSelected ? 0 : -1}
      style={style}
    >
      {children}
    </tr>
  )
}
