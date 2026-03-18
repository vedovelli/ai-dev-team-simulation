/**
 * Export Utilities for Report Data
 *
 * Client-side export functionality for converting data to CSV and JSON formats.
 * Uses Blob and URL.createObjectURL for browser download without external libraries.
 */

/**
 * Convert an array of objects to CSV format
 *
 * @param data - Array of objects to convert
 * @param filename - Name of the file to download (without extension)
 * @returns void (triggers download in browser)
 *
 * @example
 * const data = [
 *   { name: 'Alice', score: 95 },
 *   { name: 'Bob', score: 87 }
 * ]
 * exportToCSV(data, 'results')
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Extract headers from first object
  const headers = Object.keys(data[0])

  // Create header row
  const headerRow = headers.map(escapeCSVField).join(',')

  // Create data rows
  const dataRows = data.map((row) =>
    headers.map((header) => escapeCSVField(String(row[header] ?? ''))).join(','),
  )

  // Combine header and data
  const csv = [headerRow, ...dataRows].join('\n')

  // Create blob and download
  downloadBlob(csv, `${filename}.csv`, 'text/csv')
}

/**
 * Convert an array of objects or single object to JSON format
 *
 * @param data - Object or array of objects to convert
 * @param filename - Name of the file to download (without extension)
 * @returns void (triggers download in browser)
 *
 * @example
 * const report = { id: 'sprint-1', velocity: 42 }
 * exportToJSON(report, 'sprint-report')
 */
export function exportToJSON<T extends Record<string, unknown> | Record<string, unknown>[]>(
  data: T,
  filename: string,
): void {
  if (!data) {
    console.warn('No data to export')
    return
  }

  const json = JSON.stringify(data, null, 2)
  downloadBlob(json, `${filename}.json`, 'application/json')
}

/**
 * Escape CSV field values to handle commas, quotes, and newlines
 *
 * @param field - Raw field value
 * @returns Escaped CSV field
 */
function escapeCSVField(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"` // Double quotes to escape
  }
  return field
}

/**
 * Create blob and trigger browser download
 *
 * @param content - File content as string
 * @param filename - Name of file to download
 * @param mimeType - MIME type of content
 */
function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)

  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
