import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useSprintReport } from '../hooks/queries/sprints'
import { exportSprintReportToCSV } from '../utils/csvExport'
import type { SprintReport } from '../types/sprint'

interface SprintReportModalProps {
  sprintId: string
  sprintName: string
  isOpen: boolean
  onClose: () => void
}

interface ReportFilters {
  startDate: string
  endDate: string
}

export function SprintReportModal({
  sprintId,
  sprintName,
  isOpen,
  onClose,
}: SprintReportModalProps) {
  const [filters, setFilters] = useState<ReportFilters | null>(null)
  const [showReport, setShowReport] = useState(false)

  const { data: report, isLoading, error } = useSprintReport(
    sprintId,
    filters ? { startDate: filters.startDate, endDate: filters.endDate } : undefined
  )

  const form = useForm({
    defaultValues: {
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks ago
      endDate: new Date().toISOString().split('T')[0], // today
    },
    onSubmit: async (values) => {
      setFilters({
        startDate: values.startDate,
        endDate: values.endDate,
      })
      setShowReport(true)
    },
  })

  const handleExportCSV = () => {
    if (report) {
      exportSprintReportToCSV(report, `sprint-report-${sprintId}.csv`)
    }
  }

  const handleClose = () => {
    setShowReport(false)
    setFilters(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Sprint Report</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showReport ? (
            // Filter form
            <form
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
              className="space-y-4"
            >
              <p className="text-gray-600 mb-6">
                Generate a performance report for <strong>{sprintName}</strong>
              </p>

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="startDate"
                  children={(field) => (
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="endDate"
                  children={(field) => (
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </form>
          ) : (
            // Report display
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  Failed to generate report: {error.message}
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {report && (
                <>
                  {/* Report Header */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.sprintName}</h3>
                    <p className="text-sm text-gray-600">
                      {report.startDate} to {report.endDate}
                    </p>
                  </div>

                  {/* Summary Metrics */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Summary Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Average Velocity</p>
                        <p className="text-2xl font-bold text-blue-600">{report.summary.averageVelocity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average Completion Rate</p>
                        <p className="text-2xl font-bold text-green-600">{report.summary.averageCompletionRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Tasks Completed</p>
                        <p className="text-2xl font-bold text-purple-600">{report.summary.totalTasksCompleted}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Peak Capacity Utilization</p>
                        <p className="text-2xl font-bold text-orange-600">{report.summary.peakCapacityUtilization}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Data Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <h4 className="font-semibold text-gray-900 bg-gray-50 px-4 py-3 border-b border-gray-200">
                      Daily Metrics
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-700 font-medium">Date</th>
                            <th className="px-4 py-2 text-right text-gray-700 font-medium">Velocity</th>
                            <th className="px-4 py-2 text-right text-gray-700 font-medium">Completion %</th>
                            <th className="px-4 py-2 text-right text-gray-700 font-medium">Completed</th>
                            <th className="px-4 py-2 text-right text-gray-700 font-medium">In Progress</th>
                            <th className="px-4 py-2 text-right text-gray-700 font-medium">Capacity %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.dataPoints.slice(-7).map((point, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 text-gray-900">{point.date}</td>
                              <td className="px-4 py-2 text-right text-gray-900">{point.velocity}</td>
                              <td className="px-4 py-2 text-right text-gray-900">{point.completionRate}%</td>
                              <td className="px-4 py-2 text-right text-gray-900">{point.tasksCompleted}</td>
                              <td className="px-4 py-2 text-right text-gray-900">{point.tasksInProgress}</td>
                              <td className="px-4 py-2 text-right text-gray-900">{point.capacityUtilization}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 px-4 py-2 bg-gray-50 border-t border-gray-200">
                      Showing last 7 days. Full data available in CSV export.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      onClick={() => setShowReport(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      <span>↓</span> Export as CSV
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
