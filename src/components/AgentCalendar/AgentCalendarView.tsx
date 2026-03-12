import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subtractMonths } from 'date-fns'
import type { DailyAvailability } from '../../types/agent'
import { AgentCalendarHeader } from './AgentCalendarHeader'
import { AvailabilityDayCell } from './AvailabilityDayCell'

interface AgentCalendarViewProps {
  availability?: DailyAvailability[]
  month?: number
  year?: number
  onMonthChange?: (month: number, year: number) => void
  isLoading?: boolean
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Main calendar view component for agent availability
 * Displays a month-based grid with availability status, task counts, and conflict indicators
 */
export function AgentCalendarView({
  availability = [],
  month: initialMonth,
  year: initialYear,
  onMonthChange,
  isLoading = false,
}: AgentCalendarViewProps) {
  const now = new Date()
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date(initialYear || now.getFullYear(), (initialMonth || now.getMonth() + 1) - 1, 1)
  })

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  // Create availability map for quick lookup
  const availabilityMap = useMemo(() => {
    const map = new Map<string, DailyAvailability>()
    availability.forEach((avail) => {
      map.set(avail.date, avail)
    })
    return map
  }, [availability])

  // Generate all dates for calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    })

    // Get first day padding (previous month dates)
    const firstDayOfWeek = monthStart.getDay()
    const previousMonthEnd = new Date(monthStart)
    previousMonthEnd.setDate(0)
    
    const paddingDays = []
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(previousMonthEnd)
      date.setDate(previousMonthEnd.getDate() - i)
      paddingDays.push(date)
    }

    // Get last day padding (next month dates)
    const lastDayOfWeek = monthEnd.getDay()
    const nextMonthStart = new Date(monthEnd)
    nextMonthStart.setDate(1)
    nextMonthStart.setMonth(nextMonthStart.getMonth() + 1)
    
    const trailingDays = []
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const date = new Date(nextMonthStart)
      date.setDate(i)
      trailingDays.push(date)
    }

    return [...paddingDays, ...days, ...trailingDays]
  }, [monthStart, monthEnd])

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    const newDate = subtractMonths(currentDate, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getMonth() + 1, newDate.getFullYear())
  }, [currentDate, onMonthChange])

  const handleNextMonth = useCallback(() => {
    const newDate = addMonths(currentDate, 1)
    setCurrentDate(newDate)
    onMonthChange?.(newDate.getMonth() + 1, newDate.getFullYear())
  }, [currentDate, onMonthChange])

  // Keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevMonth()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextMonth()
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePrevMonth, handleNextMonth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full focus:outline-none" tabIndex={0}>
      <AgentCalendarHeader
        month={month}
        year={year}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {WEEKDAY_HEADERS.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-700 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, idx) => {
          const dateStr = date.toISOString().split('T')[0]
          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          const dayAvailability = availabilityMap.get(dateStr)

          return (
            <AvailabilityDayCell
              key={idx}
              date={date}
              availability={
                dayAvailability || {
                  date: dateStr,
                  agentId: '',
                  availabilityStatus: 'available',
                  tasksScheduled: 0,
                  hasConflict: false,
                }
              }
              isWeekend={isWeekend}
              isCurrentMonth={isCurrentMonth}
            />
          )
        })}
      </div>

      {/* Keyboard hint */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Tip: Use arrow keys to navigate between months
      </div>
    </div>
  )
}
