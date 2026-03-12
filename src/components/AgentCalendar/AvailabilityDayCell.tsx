import { isToday } from 'date-fns'
import type { DailyAvailability } from '../../types/agent'
import { ConflictIndicator } from './ConflictIndicator'

interface AvailabilityDayCellProps {
  date: Date
  availability: DailyAvailability
  isWeekend: boolean
  isCurrentMonth: boolean
}

export function AvailabilityDayCell({
  date,
  availability,
  isWeekend,
  isCurrentMonth,
}: AvailabilityDayCellProps) {
  const day = date.getDate()
  const isToday_ = isToday(date)

  // Determine background color based on availability
  let bgColor = 'bg-white'
  let availabilityDisplay = ''

  if (!isCurrentMonth) {
    bgColor = 'bg-gray-50'
  } else if (isWeekend) {
    bgColor = 'bg-gray-100'
    availabilityDisplay = 'Weekend'
  } else if (availability.availabilityStatus === 'available') {
    bgColor = 'bg-green-50'
    availabilityDisplay = 'Available'
  } else if (availability.availabilityStatus === 'unavailable') {
    bgColor = 'bg-red-50'
    availabilityDisplay = 'Unavailable'
  } else {
    bgColor = 'bg-yellow-50'
    availabilityDisplay = 'Partial'
  }

  const ringColor = isToday_ ? 'ring-2 ring-blue-500' : ''

  return (
    <div
      className={`
        min-h-24 p-2 border border-gray-200 rounded-lg
        ${bgColor} ${ringColor}
        transition-all hover:shadow-md
        flex flex-col
      `}
    >
      {/* Day number */}
      <div className="text-sm font-semibold text-gray-700">{day}</div>

      {/* Availability status badge */}
      {isCurrentMonth && !isWeekend && (
        <div className="mt-1">
          <span
            className={`
              inline-block text-xs font-medium px-2 py-0.5 rounded
              ${
                availability.availabilityStatus === 'available'
                  ? 'bg-green-200 text-green-800'
                  : availability.availabilityStatus === 'unavailable'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-yellow-200 text-yellow-800'
              }
            `}
          >
            {availabilityDisplay}
          </span>
        </div>
      )}

      {/* Task count badge */}
      {isCurrentMonth && availability.tasksScheduled > 0 && (
        <div className="mt-1">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
            {availability.tasksScheduled} task{availability.tasksScheduled > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Conflict indicator */}
      {isCurrentMonth && availability.hasConflict && (
        <div className="mt-1">
          <ConflictIndicator
            reason={availability.conflictReason}
            severity={
              availability.availabilityStatus === 'unavailable' ? 'error' : 'warning'
            }
          />
        </div>
      )}
    </div>
  )
}
