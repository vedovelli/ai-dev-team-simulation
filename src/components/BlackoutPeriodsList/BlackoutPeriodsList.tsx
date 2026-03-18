/**
 * BlackoutPeriodsList - Table view and management of blackout periods
 *
 * Displays upcoming blackout periods with date ranges and reasons.
 * Allows adding new periods via a form and removing existing ones.
 */

import React, { useState } from 'react'
import type { BlackoutPeriod } from '../../types/agent-scheduling'
import { AddBlackoutForm } from './AddBlackoutForm'

interface BlackoutPeriodsListProps {
  blackoutPeriods: BlackoutPeriod[]
  onAddBlackout: (period: BlackoutPeriod) => void
  onDeleteBlackout: (startDate: string, endDate: string) => void
  isAddingLoading?: boolean
  isDeletingLoading?: boolean
}

/**
 * Format date as YYYY-MM-DD to readable format
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Calculate days in blackout period
 */
function getDayCount(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Check if blackout period is upcoming (starts today or later)
 */
function isUpcoming(startDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  return start >= today
}

export function BlackoutPeriodsList({
  blackoutPeriods,
  onAddBlackout,
  onDeleteBlackout,
  isAddingLoading = false,
  isDeletingLoading = false,
}: BlackoutPeriodsListProps) {
  const [showForm, setShowForm] = useState(false)

  // Filter to upcoming blackouts (future or today)
  const upcomingBlackouts = blackoutPeriods.filter((bp) => isUpcoming(bp.startDate))
  const sortedBlackouts = upcomingBlackouts.sort((a, b) => a.startDate.localeCompare(b.startDate))

  const handleAddBlackout = (period: BlackoutPeriod) => {
    onAddBlackout(period)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Blackout Periods</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Add blackout
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <AddBlackoutForm
          onSubmit={handleAddBlackout}
          onCancel={() => setShowForm(false)}
          isLoading={isAddingLoading}
        />
      )}

      {/* Blackouts table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {sortedBlackouts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">No upcoming blackout periods scheduled.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Start
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  End
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Days
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Reason
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedBlackouts.map((period) => (
                <tr key={`${period.startDate}-${period.endDate}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(period.startDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(period.endDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getDayCount(period.startDate, period.endDate)} days
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{period.reason}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        onDeleteBlackout(period.startDate, period.endDate)
                      }
                      disabled={isDeletingLoading}
                      className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
