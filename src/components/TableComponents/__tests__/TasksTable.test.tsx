import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TasksTable } from '../TasksTable'
import type { Task } from '../../../types/task'

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Task 1',
    assignee: 'John',
    team: 'Frontend',
    status: 'backlog',
    priority: 'high',
    storyPoints: 5,
    sprint: 'Sprint 1',
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Task 2',
    assignee: 'Jane',
    team: 'Backend',
    status: 'in-progress',
    priority: 'medium',
    storyPoints: 3,
    sprint: 'Sprint 1',
    order: 2,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
]

const createTestRouter = () => {
  const memoryHistory = createMemoryHistory({ initialEntries: ['/'] })

  const rootRoute = createRootRoute({
    component: () => null,
  })

  return createRouter({
    routeTree: rootRoute,
    history: memoryHistory,
  })
}

const renderWithRouter = (component: React.ReactElement) => {
  const router = createTestRouter()
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router}>
        {component}
      </RouterProvider>
    </QueryClientProvider>
  )
}

describe('TasksTable', () => {
  it('renders tasks in a table', () => {
    renderWithRouter(<TasksTable tasks={mockTasks} />)

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('renders loading state', () => {
    const { rerender } = renderWithRouter(<TasksTable tasks={[]} isLoading={true} />)

    expect(screen.getByRole('table', { hidden: true }).parentElement?.querySelector('.animate-pulse')).toBeFalsy()

    rerender(<TasksTable tasks={mockTasks} isLoading={false} />)
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  it('renders empty state when no tasks', () => {
    renderWithRouter(<TasksTable tasks={[]} />)

    expect(screen.getByText('No tasks available')).toBeInTheDocument()
  })

  it('displays search input', () => {
    renderWithRouter(<TasksTable tasks={mockTasks} />)

    const searchInput = screen.getByPlaceholderText('Search tasks by title...')
    expect(searchInput).toBeInTheDocument()
  })

  it('displays filter controls', () => {
    renderWithRouter(<TasksTable tasks={mockTasks} />)

    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority')).toBeInTheDocument()
  })

  it('displays pagination controls', () => {
    renderWithRouter(<TasksTable tasks={mockTasks} />)

    expect(screen.getByLabelText('Items per page')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeInTheDocument()
  })

  it('displays correct columns', () => {
    renderWithRouter(<TasksTable tasks={mockTasks} />)

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Deadline')).toBeInTheDocument()
  })
})
