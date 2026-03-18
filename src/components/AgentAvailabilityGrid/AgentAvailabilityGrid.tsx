/**
 * AgentAvailabilityGrid - Weekly availability display and editor
 *
 * Shows a 7-column grid (Mon-Sun) with clickable day cells to view/edit availability
 * windows for that day. Blackout days are highlighted with a muted background.
 */

import React, { useState } from 'react'
import type { AvailabilityWindow, BlackoutPeriod, DayOfWeek } from '../../types/agent-scheduling'
import { EditAvailabilityPopover } from './EditAvailabilityPopover'

interface AgentAvailabilityGridProps {
  availabilityWindows: AvailabilityWindow[]
  blackoutPeriods: BlackoutPeriod[]
  currentDate: Date
  onUpdateWindows: (windows: AvailabilityWindow[]) => void
  isLoading?: boolean
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Format time as HH:MM (24-hour)
 */
function formatTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

/**
 * Get availability window for a specific day (0=Sun, 1=Mon, etc)
 */
function getWindowForDay(
  windows: AvailabilityWindow[],
  dayOfWeek: DayOfWeek
): AvailabilityWindow | undefined {
  return windows.find((w) => w.dayOfWeek === dayOfWeek)
}

/**
 * Check if date is within any blackout period
 */
function isDateInBlackout(date: Date, blackouts: BlackoutPeriod[]): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return blackouts.some((bp) => dateStr >= bp.startDate && dateStr < bp.endDate)
}

/**
 * Get blackout reason for a date
 */
function getBlackoutReason(date: Date, blackouts: BlackoutPeriod[]): string | undefined {
  const dateStr = date.toISOString().split('T')[0]
  return blackouts.find((bp) => dateStr >= bp.startDate && dateStr < bp.endDate)?.reason
}

export function AgentAvailabilityGrid({
  availabilityWindows,
  blackoutPeriods,
  currentDate,
  onUpdateWindows,
  isLoading = false,
}: AgentAvailabilityGridProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)

  // Get the Monday of this week
  const dayOfWeek = currentDate.getDay()
  const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const monday = new Date(currentDate.setDate(diff))

  const handleDayClick = (e: React.MouseEvent<HTMLElement>, day: DayOfWeek) => {
    setSelectedDay(day)
    setPopoverAnchor(e.currentTarget)
  }

  const handleSaveWindow = (window: AvailabilityWindow | null) => {
    if (selectedDay === null) return

    let newWindows = availabilityWindows.filter((w) => w.dayOfWeek !== selectedDay)
    if (window) {
      newWindows = [...newWindows, window]
    }

    onUpdateWindows(newWindows)
    setSelectedDay(null)
    setPopoverAnchor(null)
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <div className="grid grid-cols-7 gap-2">
          {/* Headers */}
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600">
              {day}
            </div>
          ))}

          {/* Grid cells */}
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
            const dayOfWeek = dayIndex as DayOfWeek
            const cellDate = new Date(monday)
            cellDate.setDate(cellDate.getDate() + dayIndex)
            const window = getWindowForDay(availabilityWindows, dayOfWeek)
            const inBlackout = isDateInBlackout(cellDate, blackoutPeriods)
            const blackoutReason = getBlackoutReason(cellDate, blackoutPeriods)

            return (
              <button
                key={dayIndex}
                onClick={(e) => handleDayClick(e, dayOfWeek)}
                disabled={isLoading}
                className={`
                  p-3 rounded border-2 text-left transition-colors min-h-24
                  ${
                    inBlackout
                      ? 'bg-red-50 border-red-200'
                      : selectedDay === dayOfWeek
                        ? 'bg-blue-50 border-blue-400'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  {cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>

                {inBlackout ? (
                  <div className="text-sm font-medium text-red-700">{blackoutReason}</div>
                ) : window ? (
                  <div className="text-sm">
                    <div className="font-medium text-gray-800">
                      {formatTime(window.startHour)}–{formatTime(window.endHour)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {window.endHour - window.startHour} hours
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-medium text-gray-400">Unavailable</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Edit popover */}
      {selectedDay !== null && popoverAnchor && (
        <EditAvailabilityPopover
          dayOfWeek={selectedDay}
          currentWindow={getWindowForDay(availabilityWindows, selectedDay)}
          onSave={handleSaveWindow}
          onCancel={() => {
            setSelectedDay(null)
            setPopoverAnchor(null)
          }}
          anchor={popoverAnchor}
        />
      )}
    </div>
  )
}
