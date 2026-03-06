import { useMemo } from 'react'
import type { FilterFieldDefinition, FilterState } from '../../types/filters'

interface FilterFieldProps {
  field: FilterFieldDefinition
  value: any
  onChange: (fieldName: string, value: any) => void
}

export function FilterField({ field, value, onChange }: FilterFieldProps) {
  const handleChange = (newValue: any) => {
    onChange(field.name, newValue)
  }

  // Normalize value for rendering
  const normalizedValue = useMemo(() => {
    if (field.type === 'daterange') {
      const rangeValue = value as { from?: string; to?: string } | undefined
      return rangeValue || { from: '', to: '' }
    }
    if (field.type === 'multiselect' || field.type === 'checkbox') {
      return Array.isArray(value) ? value : []
    }
    return value || ''
  }, [value, field.type])

  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
          <input
            type="text"
            value={normalizedValue as string}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Filter by ${field.label.toLowerCase()}...`}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )

    case 'select':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
          <select
            value={normalizedValue as string}
            onChange={(e) => handleChange(e.target.value || undefined)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All {field.label.toLowerCase()}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )

    case 'multiselect':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(normalizedValue as string[]).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = normalizedValue as string[]
                    if (e.target.checked) {
                      handleChange([...currentValues, option.value])
                    } else {
                      handleChange(currentValues.filter((v) => v !== option.value))
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )

    case 'checkbox':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(normalizedValue as string[]).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = normalizedValue as string[]
                    if (e.target.checked) {
                      handleChange([...currentValues, option.value])
                    } else {
                      handleChange(currentValues.filter((v) => v !== option.value))
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )

    case 'daterange':
      const rangeValue = normalizedValue as { from?: string; to?: string }
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={rangeValue.from || ''}
                onChange={(e) =>
                  handleChange({ ...rangeValue, from: e.target.value || undefined })
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={rangeValue.to || ''}
                onChange={(e) => handleChange({ ...rangeValue, to: e.target.value || undefined })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}
