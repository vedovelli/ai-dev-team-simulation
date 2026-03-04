import { ColumnFiltersState } from '@tanstack/react-table'
import { ReactNode } from 'react'

interface FilterInputProps {
  id: string
  label: string
  value: string | undefined
  onChange: (filters: ColumnFiltersState) => void
  placeholder?: string
}

export function TextFilter({ id, label, value, onChange, placeholder = 'Search...' }: FilterInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`filter-${id}`} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={`filter-${id}`}
        type="text"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) =>
          onChange([
            {
              id,
              value: e.target.value,
            },
          ])
        }
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

interface SelectFilterProps {
  id: string
  label: string
  value: string | undefined
  options: Array<{ label: string; value: string }>
  onChange: (filters: ColumnFiltersState) => void
  placeholder?: string
}

export function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
}: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`filter-${id}`} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={`filter-${id}`}
        value={value || ''}
        onChange={(e) =>
          onChange([
            {
              id,
              value: e.target.value || undefined,
            },
          ])
        }
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface DateRangeFilterProps {
  idFrom: string
  idTo: string
  label: string
  valueFrom: string | undefined
  valueTo: string | undefined
  onChange: (filters: ColumnFiltersState) => void
}

export function DateRangeFilter({
  idFrom,
  idTo,
  label,
  valueFrom,
  valueTo,
  onChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="date"
          value={valueFrom || ''}
          onChange={(e) =>
            onChange([
              { id: idFrom, value: e.target.value || undefined },
              { id: idTo, value: valueTo },
            ])
          }
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="From"
        />
        <input
          type="date"
          value={valueTo || ''}
          onChange={(e) =>
            onChange([
              { id: idFrom, value: valueFrom },
              { id: idTo, value: e.target.value || undefined },
            ])
          }
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="To"
        />
      </div>
    </div>
  )
}

interface FilterGroupProps {
  children: ReactNode
  className?: string
}

export function FilterGroup({ children, className = '' }: FilterGroupProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 ${className}`}>
      {children}
    </div>
  )
}
