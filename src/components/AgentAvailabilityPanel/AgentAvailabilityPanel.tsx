/**
 * AgentAvailabilityPanel - Complete agent scheduling management
 *
 * Container component that combines:
 * - AgentAvailabilityGrid for viewing/editing weekly availability
 * - BlackoutPeriodsList for managing blackout periods
 * - Week navigation (prev/next)
 *
 * Integrates with useAgentScheduling hook for data management.
 */

import React, { useState } from 'react'
import { useAgentScheduling } from '../../hooks/useAgentScheduling'
import { AgentAvailabilityGrid } from '../AgentAvailabilityGrid/AgentAvailabilityGrid'
import { BlackoutPeriodsList } from '../BlackoutPeriodsList/BlackoutPeriodsList'
import type { AvailabilityWindow, BlackoutPeriod } from '../../types/agent-scheduling'

interface AgentAvailabilityPanelProps {
  agentId: string
}

/**
 * Format date range for display
 */
function formatWeekRange(startDate: Date): string {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)

  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export function AgentAvailabilityPanel({ agentId }: AgentAvailabilityPanelProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const {
    isLoading,
    error,
    availabilityWindows,
    blackoutPeriods,
    updateAvailabilityWindows,
    updateWindowsLoading,
    addBlackoutPeriod,
    addBlackoutLoading,
    deleteBlackoutPeriod,
    deleteBlackoutLoading,
  } = useAgentScheduling(agentId)

  // Get the Monday of this week
  const dayOfWeek = currentDate.getDay()
  const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(currentDate)
  weekStart.setDate(diff)

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  if (isLoading && !availabilityWindows.length) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-gray-600">Loading scheduling information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-900 mb-2">Failed to load schedule</h3>
        <p className="text-sm text-red-700">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Availability Schedule</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousWeek}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
            aria-label="Previous week"
          >
            ← Prev
          </button>
          <div className="px-4 py-2 min-w-56 text-center">
            <p className="text-sm font-semibold text-gray-900">{formatWeekRange(weekStart)}</p>
          </div>
          <button
            onClick={handleNextWeek}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
            aria-label="Next week"
          >
            Next →
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Weekly Hours</h3>
        <p className="text-sm text-gray-600 mb-4">
          Click a day to set your availability hours or mark it as unavailable.
        </p>
        <AgentAvailabilityGrid
          availabilityWindows={availabilityWindows}
          blackoutPeriods={blackoutPeriods}
          currentDate={currentDate}
          onUpdateWindows={updateAvailabilityWindows}
          isLoading={updateWindowsLoading}
        />
      </div>

      {/* Blackout periods */}
      <div role="region" aria-label="Blackout periods">
        <BlackoutPeriodsList
          blackoutPeriods={blackoutPeriods}
          onAddBlackout={addBlackoutPeriod}
          onDeleteBlackout={deleteBlackoutPeriod}
          isAddingLoading={addBlackoutLoading}
          isDeletingLoading={deleteBlackoutLoading}
        />
      </div>
    </div>
  )
}
