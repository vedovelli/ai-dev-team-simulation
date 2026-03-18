/**
 * EditAvailabilityPopover - Edit form for a specific day's availability
 *
 * Allows setting start/end hours or marking the day as blackout-free but unavailable.
 */

import React, { useState, useEffect } from 'react'
import type { AvailabilityWindow, DayOfWeek } from '../../types/agent-scheduling'

interface EditAvailabilityPopoverProps {
  dayOfWeek: DayOfWeek
  currentWindow: AvailabilityWindow | undefined
  onSave: (window: AvailabilityWindow | null) => void
  onCancel: () => void
  anchor: HTMLElement
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function EditAvailabilityPopover({
  dayOfWeek,
  currentWindow,
  onSave,
  onCancel,
  anchor,
}: EditAvailabilityPopoverProps) {
  const [startHour, setStartHour] = useState(currentWindow?.startHour ?? 9)
  const [endHour, setEndHour] = useState(currentWindow?.endHour ?? 17)
  const [isAvailable, setIsAvailable] = useState(currentWindow !== undefined)

  // Position popover near the anchor element
  const rect = anchor.getBoundingClientRect()
  const top = rect.bottom + window.scrollY + 8
  const left = rect.left + window.scrollX + rect.width / 2

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (anchor && !anchor.contains(event.target as Node)) {
        // Don't close if clicking inside the popover itself
        const popover = document.querySelector('[data-test="availability-popover"]')
        if (popover && !popover.contains(event.target as Node)) {
          onCancel()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [anchor, onCancel])

  const handleSave = () => {
    if (isAvailable && startHour < endHour) {
      onSave({
        dayOfWeek,
        startHour,
        endHour,
      })
    } else if (!isAvailable) {
      onSave(null)
    }
  }

  return (
    <div
      data-test="availability-popover"
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
        minWidth: '280px',
      }}
    >
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">{DAYS_OF_WEEK[dayOfWeek]}</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Available this day</span>
          </label>

          {isAvailable && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start hour
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={startHour}
                  onChange={(e) => setStartHour(Math.max(0, Math.min(23, parseInt(e.target.value))))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End hour
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={endHour}
                  onChange={(e) => setEndHour(Math.max(0, Math.min(24, parseInt(e.target.value))))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              {startHour >= endHour && (
                <p className="text-xs text-red-600">End hour must be after start hour</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isAvailable && startHour >= endHour}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
