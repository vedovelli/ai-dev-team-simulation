import { useEffect, useState, useCallback } from 'react'

/**
 * Custom hook that debounces search input
 * @param initialValue - Initial search value
 * @param onDebounce - Callback when debounced value changes
 * @param delay - Debounce delay in milliseconds (default: 300)
 */
export function useSearch(
  initialValue: string = '',
  onDebounce?: (value: string) => void,
  delay: number = 300
) {
  const [localValue, setLocalValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  useEffect(() => {
    setLocalValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(localValue)
      onDebounce?.(localValue)
    }, delay)

    return () => clearTimeout(timer)
  }, [localValue, delay, onDebounce])

  const handleChange = useCallback((value: string) => {
    setLocalValue(value)
  }, [])

  return {
    localValue,
    debouncedValue,
    handleChange,
  }
}
