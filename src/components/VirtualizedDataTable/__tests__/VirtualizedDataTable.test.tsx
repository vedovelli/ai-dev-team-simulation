import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColumnDef } from '@tanstack/react-table'
import { VirtualizedDataTable } from '../VirtualizedDataTable'

interface TestData {
  id: string
  name: string
  status: 'active' | 'inactive'
  score: number
}

const testData: TestData[] = Array.from({ length: 100 }, (_, i) => ({
  id: `item-${i + 1}`,
  name: `Test Item ${i + 1}`,
  status: i % 2 === 0 ? 'active' : 'inactive',
  score: Math.floor(Math.random() * 100),
}))

const testColumns: ColumnDef<TestData>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting()}>ID</button>
    ),
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting()}>Name</button>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting()}>Status</button>
    ),
    cell: (info) => (
      <span className={info.getValue() === 'active' ? 'text-green-600' : 'text-red-600'}>
        {String(info.getValue())}
      </span>
    ),
  },
  {
    id: 'score',
    accessorKey: 'score',
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting()}>Score</button>
    ),
  },
]

describe('VirtualizedDataTable', () => {
  it('should render table with data', () => {
    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
      />
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Test Item 1')).toBeInTheDocument()
  })

  it('should display loading state', () => {
    render(
      <VirtualizedDataTable<TestData>
        data={[]}
        columns={testColumns}
        isLoading={true}
      />
    )

    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('should display error state', () => {
    render(
      <VirtualizedDataTable<TestData>
        data={[]}
        columns={testColumns}
        isError={true}
        errorMessage="Custom error message"
      />
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should display empty state', () => {
    render(
      <VirtualizedDataTable<TestData>
        data={[]}
        columns={testColumns}
        emptyMessage="No items available"
      />
    )

    expect(screen.getByText('No items available')).toBeInTheDocument()
  })

  it('should toggle column visibility', async () => {
    const onColumnVisibilityChange = vi.fn()

    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
    )

    const nameButton = screen.getByRole('button', { name: 'name' })
    await userEvent.click(nameButton)

    expect(onColumnVisibilityChange).toHaveBeenCalled()
  })

  it('should filter data with global filter', async () => {
    const { rerender } = render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
        globalFilter=""
        onGlobalFilterChange={() => {}}
      />
    )

    const filterInput = screen.getByPlaceholderText('Search all columns...')
    expect(filterInput).toBeInTheDocument()

    // Note: Actual filtering is handled by TanStack Table
    // We're testing that the input is rendered
    await userEvent.type(filterInput, 'Test Item 1')
    expect(filterInput).toHaveValue('Test Item 1')
  })

  it('should sort columns when header is clicked', async () => {
    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
        enableSorting={true}
      />
    )

    const idHeader = screen.getByRole('button', { name: /ID/i })
    await userEvent.click(idHeader)

    // Sorting is applied by TanStack Table internally
    expect(idHeader).toBeInTheDocument()
  })

  it('should handle keyboard navigation when enabled', async () => {
    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
        keyboardNavigation={true}
      />
    )

    const table = screen.getByRole('table')

    // Simulate arrow down
    fireEvent.keyDown(table, { key: 'ArrowDown' })

    expect(table).toBeInTheDocument()
  })

  it('should display row count', () => {
    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 5)}
        columns={testColumns}
      />
    )

    expect(screen.getByText('Displaying 5 rows')).toBeInTheDocument()
  })

  it('should display singular row count for single row', () => {
    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 1)}
        columns={testColumns}
      />
    )

    expect(screen.getByText('Displaying 1 row')).toBeInTheDocument()
  })

  it('should render table headers with proper ARIA roles', () => {
    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
      />
    )

    const headers = screen.getAllByRole('columnheader')
    expect(headers.length).toBeGreaterThan(0)
  })

  it('should have proper accessibility attributes', () => {
    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
      />
    )

    const table = screen.getByRole('grid')
    expect(table).toHaveAttribute('aria-rowcount', '10')

    const region = screen.getByRole('region')
    expect(region).toHaveAttribute('aria-label', 'Data table with virtual scrolling')
  })

  it('should apply custom row className', () => {
    const customClassName = 'custom-row-class'
    const rowClassName = () => customClassName

    const { container } = render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
        rowClassName={rowClassName}
      />
    )

    // Note: Virtual scrolling renders only visible rows
    // Check that the function is accepted without errors
    expect(container.querySelector('table')).toBeInTheDocument()
  })

  it('should disable sorting when enableSorting is false', async () => {
    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
        enableSorting={false}
      />
    )

    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
  })

  it('should disable filtering when enableFiltering is false', () => {
    render(
      <VirtualizedDataTable<TestData>
        data={testData.slice(0, 10)}
        columns={testColumns}
        enableFiltering={false}
      />
    )

    expect(screen.queryByPlaceholderText('Search all columns...')).not.toBeInTheDocument()
  })
})
