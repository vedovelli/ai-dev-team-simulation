/**
 * CSV export utilities for sprint reports and other data
 */

import Papa from 'papaparse'
import type { SprintReport } from '../types/sprint'

/**
 * Export sprint report data to CSV format
 * Includes raw data points and summary metrics
 *
 * @param report - The sprint report to export
 * @param filename - Optional custom filename (defaults to sprint-report.csv)
 */
export function exportSprintReportToCSV(report: SprintReport, filename?: string): void {
  // Prepare data points rows
  const dataRows = report.dataPoints.map((point) => ({
    Date: point.date,
    Velocity: point.velocity,
    'Completion Rate (%)': point.completionRate,
    'Tasks Completed': point.tasksCompleted,
    'Tasks In Progress': point.tasksInProgress,
    'Capacity Utilization (%)': point.capacityUtilization,
  }))

  // Prepare summary rows with empty lines for readability
  const summaryRows = [
    {},
    { Date: 'SUMMARY' },
    {
      Date: 'Average Velocity',
      Velocity: report.summary.averageVelocity,
    },
    {
      Date: 'Average Completion Rate',
      'Completion Rate (%)': report.summary.averageCompletionRate,
    },
    {
      Date: 'Total Tasks Completed',
      'Tasks Completed': report.summary.totalTasksCompleted,
    },
    {
      Date: 'Peak Capacity Utilization',
      'Capacity Utilization (%)': report.summary.peakCapacityUtilization,
    },
    {
      Date: 'Low Capacity Utilization',
      'Capacity Utilization (%)': report.summary.lowCapacityUtilization,
    },
  ]

  // Combine all rows
  const allRows = [
    {
      'Sprint ID': report.sprintId,
      'Sprint Name': report.sprintName,
      'Start Date': report.startDate,
      'End Date': report.endDate,
    },
    {},
    ...dataRows,
    ...summaryRows,
  ]

  // Generate CSV using papaparse
  const csv = Papa.unparse(allRows)

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  const defaultFilename = `sprint-report-${report.sprintId}-${new Date().toISOString().split('T')[0]}.csv`
  link.setAttribute('href', url)
  link.setAttribute('download', filename || defaultFilename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Generate CSV content as string without downloading
 * Useful for testing or sending data to server
 *
 * @param report - The sprint report to export
 * @returns CSV content as string
 */
export function generateSprintReportCSVContent(report: SprintReport): string {
  const dataRows = report.dataPoints.map((point) => ({
    Date: point.date,
    Velocity: point.velocity,
    'Completion Rate (%)': point.completionRate,
    'Tasks Completed': point.tasksCompleted,
    'Tasks In Progress': point.tasksInProgress,
    'Capacity Utilization (%)': point.capacityUtilization,
  }))

  const summaryRows = [
    {},
    { Date: 'SUMMARY' },
    {
      Date: 'Average Velocity',
      Velocity: report.summary.averageVelocity,
    },
    {
      Date: 'Average Completion Rate',
      'Completion Rate (%)': report.summary.averageCompletionRate,
    },
    {
      Date: 'Total Tasks Completed',
      'Tasks Completed': report.summary.totalTasksCompleted,
    },
    {
      Date: 'Peak Capacity Utilization',
      'Capacity Utilization (%)': report.summary.peakCapacityUtilization,
    },
    {
      Date: 'Low Capacity Utilization',
      'Capacity Utilization (%)': report.summary.lowCapacityUtilization,
    },
  ]

  const allRows = [
    {
      'Sprint ID': report.sprintId,
      'Sprint Name': report.sprintName,
      'Start Date': report.startDate,
      'End Date': report.endDate,
    },
    {},
    ...dataRows,
    ...summaryRows,
  ]

  return Papa.unparse(allRows)
}
