import { useCallback } from 'react'

interface FilterInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onClear: () => void
  label?: string
  disabled?: boolean
}

export function FilterInput({
  placeholder = 'Filter...',
  value,
  onChange,
  onClear,
  label,
  disabled = false,
}: FilterInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onClear()
  }, [onClear])

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={label || placeholder}
        />
        {value && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            aria-label="Clear filter"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
