/**
 * AddBlackoutForm - Form to add a new blackout period
 *
 * Collects start date, end date, and reason for unavailability.
 */

import React, { useState } from 'react'
import type { BlackoutPeriod } from '../../types/agent-scheduling'

interface AddBlackoutFormProps {
  onSubmit: (period: BlackoutPeriod) => void
  onCancel: () => void
  isLoading?: boolean
}

export function AddBlackoutForm({ onSubmit, onCancel, isLoading = false }: AddBlackoutFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!startDate || !endDate || !reason.trim()) {
      setError('All fields are required')
      return
    }

    if (startDate > endDate) {
      setError('End date must be after start date')
      return
    }

    // End date is exclusive in the API, so add one day
    const endDateExclusive = new Date(endDate)
    endDateExclusive.setDate(endDateExclusive.getDate() + 1)

    onSubmit({
      startDate,
      endDate: endDateExclusive.toISOString().split('T')[0],
      reason,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., PTO, Conference, Maintenance"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Adding...' : 'Add blackout'}
        </button>
      </div>
    </form>
  )
}
