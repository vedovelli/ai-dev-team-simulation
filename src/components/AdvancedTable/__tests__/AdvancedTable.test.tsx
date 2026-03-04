import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { AdvancedTable, useAdvancedTableState } from '../'

interface MockData {
  id: string
  title: string
  status: string
}

const mockColumns: ColumnDef<MockData>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    header: 'ID',
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: 'Title',
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
  },
]

const mockData: MockData[] = [
  { id: '1', title: 'Task 1', status: 'done' },
  { id: '2', title: 'Task 2', status: 'pending' },
  { id: '3', title: 'Task 3', status: 'done' },
]

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('AdvancedTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with data', () => {
    renderWithQueryClient(
      <AdvancedTable
        data={mockData}
        columns={mockColumns}
        pageIndex={0}
        pageSize={25}
        total={3}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    )

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('renders loading state', () => {
    renderWithQueryClient(
      <AdvancedTable
        data={[]}
        columns={mockColumns}
        pageIndex={0}
        pageSize={25}
        total={0}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
        isLoading={true}
      />
    )

    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    renderWithQueryClient(
      <AdvancedTable
        data={[]}
        columns={mockColumns}
        pageIndex={0}
        pageSize={25}
        total={0}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
        isError={true}
        errorMessage="Failed to load data"
      />
    )

    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    renderWithQueryClient(
      <AdvancedTable
        data={[]}
        columns={mockColumns}
        pageIndex={0}
        pageSize={25}
        total={0}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
        emptyMessage="No tasks available"
      />
    )

    expect(screen.getByText('No tasks available')).toBeInTheDocument()
  })

  it('displays pagination controls', () => {
    renderWithQueryClient(
      <AdvancedTable
        data={mockData}
        columns={mockColumns}
        pageIndex={0}
        pageSize={2}
        total={100}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    )

    expect(screen.getByText(/Page 1 of 50/)).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
  })

  it('calls onPageIndexChange when next page button is clicked', () => {
    const onPageIndexChange = vi.fn()
    renderWithQueryClient(
      <AdvancedTable
        data={mockData}
        columns={mockColumns}
        pageIndex={0}
        pageSize={2}
        total={100}
        sorting={[]}
        onPageIndexChange={onPageIndexChange}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    )

    const nextButton = screen.getByLabelText('Next page')
    fireEvent.click(nextButton)

    expect(onPageIndexChange).toHaveBeenCalledWith(1)
  })

  it('calls onPageIndexChange when previous page button is clicked', () => {
    const onPageIndexChange = vi.fn()
    renderWithQueryClient(
      <AdvancedTable
        data={mockData}
        columns={mockColumns}
        pageIndex={1}
        pageSize={2}
        total={100}
        sorting={[]}
        onPageIndexChange={onPageIndexChange}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    )

    const previousButton = screen.getByLabelText('Previous page')
    fireEvent.click(previousButton)

    expect(onPageIndexChange).toHaveBeenCalledWith(0)
  })

  it('disables previous button on first page', () => {
    renderWithQueryClient(
      <AdvancedTable
        data={mockData}
        columns={mockColumns}
        pageIndex={0}
        pageSize={2}
        total={100}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    )

    const previousButton = screen.getByLabelText('Previous page') as HTMLButtonElement
    expect(previousButton.disabled).toBe(true)
  })

  it('disables next button on last page', () => {
    renderWithQueryClient(
      <AdvancedTable
        data={mockData}
        columns={mockColumns}
        pageIndex={4}
        pageSize={25}
        total={100}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    )

    const nextButton = screen.getByLabelText('Next page') as HTMLButtonElement
    expect(nextButton.disabled).toBe(true)
  })

  it('calls onPageSizeChange when page size is changed', () => {
    const onPageSizeChange = vi.fn()
    renderWithQueryClient(
      <AdvancedTable
        data={mockData}
        columns={mockColumns}
        pageIndex={0}
        pageSize={10}
        total={100}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
        onSortingChange={vi.fn()}
        pageSizeOptions={[10, 25, 50]}
      />
    )

    const select = screen.getByDisplayValue('10') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '25' } })

    expect(onPageSizeChange).toHaveBeenCalledWith(25)
  })

  it('displays correct row count info', () => {
    renderWithQueryClient(
      <AdvancedTable
        data={mockData}
        columns={mockColumns}
        pageIndex={0}
        pageSize={10}
        total={25}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    )

    expect(screen.getByText(/Showing 1 to 3 of 25/)).toBeInTheDocument()
  })

  it('renders column headers', () => {
    renderWithQueryClient(
      <AdvancedTable
        data={mockData}
        columns={mockColumns}
        pageIndex={0}
        pageSize={25}
        total={3}
        sorting={[]}
        onPageIndexChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortingChange={vi.fn()}
      />
    )

    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })
})

describe('useAdvancedTableState', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useAdvancedTableState())

    expect(result.current.pageIndex).toBe(0)
    expect(result.current.pageSize).toBe(25)
    expect(result.current.sorting).toEqual([])
  })

  it('initializes with custom values', () => {
    const { result } = renderHook(() =>
      useAdvancedTableState({
        initialPageIndex: 1,
        initialPageSize: 50,
        initialSorting: [{ id: 'title', desc: false }],
      })
    )

    expect(result.current.pageIndex).toBe(1)
    expect(result.current.pageSize).toBe(50)
    expect(result.current.sorting).toEqual([{ id: 'title', desc: false }])
  })

  it('updates page index', async () => {
    const { result } = renderHook(() => useAdvancedTableState())

    fireEvent.click(screen.getByText('Next'))
    await waitFor(() => {
      expect(result.current.pageIndex).toBe(1)
    })
  })

  it('resets state to initial values', async () => {
    const { result } = renderHook(() =>
      useAdvancedTableState({
        initialPageIndex: 0,
        initialPageSize: 25,
      })
    )

    // Change state
    result.current.setPageIndex(5)
    result.current.setPageSize(50)

    // Reset
    result.current.resetState()

    await waitFor(() => {
      expect(result.current.pageIndex).toBe(0)
      expect(result.current.pageSize).toBe(25)
    })
  })
})

// Helper function for renderHook
function renderHook<T>(hook: () => T) {
  let result: { current: T } = { current: {} as T }

  const TestComponent = () => {
    result.current = hook()
    return null
  }

  render(<TestComponent />)
  return { result }
}
