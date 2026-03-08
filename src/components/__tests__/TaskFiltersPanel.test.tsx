import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskFiltersPanel, type TaskFiltersFormData } from '../TaskFiltersPanel'

describe('TaskFiltersPanel', () => {
  const mockAssignees = ['Alice', 'Bob', 'Charlie', 'Diana']
  const mockOnFiltersApply = vi.fn()

  beforeEach(() => {
    mockOnFiltersApply.mockClear()
  })

  describe('Rendering', () => {
    it('renders all filter inputs', () => {
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
        />
      )

      expect(screen.getByLabelText('Search Tasks')).toBeInTheDocument()
      expect(screen.getByLabelText('Priority')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Assignee')).toBeInTheDocument()
      expect(screen.getByLabelText('Due Date From')).toBeInTheDocument()
      expect(screen.getByLabelText('Due Date To')).toBeInTheDocument()
    })

    it('renders status checkboxes for all statuses', () => {
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
        />
      )

      expect(screen.getByRole('checkbox', { name: /backlog/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /in progress/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /in review/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /done/i })).toBeInTheDocument()
    })

    it('renders apply filters and clear all buttons', () => {
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
        />
      )

      expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument()
    })

    it('populates assignee dropdown with provided assignees', () => {
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
        />
      )

      const assigneeSelect = screen.getByLabelText('Assignee') as HTMLSelectElement
      expect(assigneeSelect.options).toHaveLength(mockAssignees.length + 1) // +1 for "All Assignees"
      expect(assigneeSelect.options[1].textContent).toBe('Alice')
      expect(assigneeSelect.options[2].textContent).toBe('Bob')
    })
  })

  describe('Search Input', () => {
    it('updates search value when user types', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
        />
      )

      const searchInput = screen.getByLabelText('Search Tasks') as HTMLInputElement
      await user.type(searchInput, 'test search')

      expect(searchInput.value).toBe('test search')
    })

    it('debounces form submission on search change', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const searchInput = screen.getByLabelText('Search Tasks')
      await user.type(searchInput, 'test')

      // Should not have called yet (within debounce)
      expect(mockOnFiltersApply).not.toHaveBeenCalled()

      // Wait for debounce
      await waitFor(
        () => {
          expect(mockOnFiltersApply).toHaveBeenCalled()
        },
        { timeout: 200 }
      )
    })
  })

  describe('Priority Filter', () => {
    it('updates priority when user selects from dropdown', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const prioritySelect = screen.getByLabelText('Priority') as HTMLSelectElement
      await user.selectOptions(prioritySelect, 'high')

      expect(prioritySelect.value).toBe('high')

      await waitFor(
        () => {
          expect(mockOnFiltersApply).toHaveBeenCalledWith(
            expect.objectContaining({ priority: 'high' })
          )
        },
        { timeout: 200 }
      )
    })

    it('clears priority when user selects "All Priorities"', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const prioritySelect = screen.getByLabelText('Priority') as HTMLSelectElement

      // Select a priority
      await user.selectOptions(prioritySelect, 'high')
      await waitFor(() => expect(mockOnFiltersApply).toHaveBeenCalled())
      mockOnFiltersApply.mockClear()

      // Clear it
      await user.selectOptions(prioritySelect, '')

      expect(prioritySelect.value).toBe('')

      await waitFor(
        () => {
          expect(mockOnFiltersApply).toHaveBeenCalledWith(
            expect.objectContaining({ priority: null })
          )
        },
        { timeout: 200 }
      )
    })
  })

  describe('Status Filter (Multi-select)', () => {
    it('toggles status checkboxes', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const backlogCheckbox = screen.getByRole('checkbox', { name: /backlog/i })
      const inProgressCheckbox = screen.getByRole('checkbox', { name: /in progress/i })

      await user.click(backlogCheckbox)
      expect(backlogCheckbox).toBeChecked()

      await user.click(inProgressCheckbox)
      expect(inProgressCheckbox).toBeChecked()

      await waitFor(
        () => {
          expect(mockOnFiltersApply).toHaveBeenCalledWith(
            expect.objectContaining({
              statuses: expect.arrayContaining(['backlog', 'in-progress']),
            })
          )
        },
        { timeout: 200 }
      )
    })

    it('unchecks status when clicked again', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const backlogCheckbox = screen.getByRole('checkbox', { name: /backlog/i })

      await user.click(backlogCheckbox)
      expect(backlogCheckbox).toBeChecked()

      await user.click(backlogCheckbox)
      expect(backlogCheckbox).not.toBeChecked()

      await waitFor(
        () => {
          expect(mockOnFiltersApply).toHaveBeenCalledWith(
            expect.objectContaining({ statuses: [] })
          )
        },
        { timeout: 200 }
      )
    })
  })

  describe('Assignee Filter', () => {
    it('updates assignee when user selects from dropdown', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const assigneeSelect = screen.getByLabelText('Assignee') as HTMLSelectElement
      await user.selectOptions(assigneeSelect, 'Alice')

      expect(assigneeSelect.value).toBe('Alice')

      await waitFor(
        () => {
          expect(mockOnFiltersApply).toHaveBeenCalledWith(
            expect.objectContaining({ assignee: 'Alice' })
          )
        },
        { timeout: 200 }
      )
    })
  })

  describe('Date Range Filter', () => {
    it('updates due date range when user enters dates', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const dueDateFromInput = screen.getByLabelText('Due Date From') as HTMLInputElement
      const dueDateToInput = screen.getByLabelText('Due Date To') as HTMLInputElement

      await user.type(dueDateFromInput, '2026-03-01')
      await user.type(dueDateToInput, '2026-03-31')

      expect(dueDateFromInput.value).toBe('2026-03-01')
      expect(dueDateToInput.value).toBe('2026-03-31')

      await waitFor(
        () => {
          expect(mockOnFiltersApply).toHaveBeenCalledWith(
            expect.objectContaining({
              dueDateFrom: '2026-03-01',
              dueDateTo: '2026-03-31',
            })
          )
        },
        { timeout: 200 }
      )
    })
  })

  describe('Active Filter Count', () => {
    it('does not display badge when no filters are active', () => {
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
        />
      )

      expect(screen.queryByText(/active/i)).not.toBeInTheDocument()
    })

    it('displays correct active filter count', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const searchInput = screen.getByLabelText('Search Tasks')
      const prioritySelect = screen.getByLabelText('Priority') as HTMLSelectElement

      await user.type(searchInput, 'test')
      await user.selectOptions(prioritySelect, 'high')

      await waitFor(() => {
        expect(screen.getByText(/2 active/i)).toBeInTheDocument()
      })
    })
  })

  describe('Clear All Action', () => {
    it('shows clear all button when filters are active', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const searchInput = screen.getByLabelText('Search Tasks')
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
      })
    })

    it('clears all filters when clear all button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const searchInput = screen.getByLabelText('Search Tasks') as HTMLInputElement
      const prioritySelect = screen.getByLabelText('Priority') as HTMLSelectElement

      // Set some filters
      await user.type(searchInput, 'test')
      await user.selectOptions(prioritySelect, 'high')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
      })

      // Click clear all
      const clearButton = screen.getByRole('button', { name: /clear all/i })
      await user.click(clearButton)

      await waitFor(() => {
        expect(searchInput.value).toBe('')
        expect(prioritySelect.value).toBe('')
      })
    })
  })

  describe('Apply Filters Button', () => {
    it('calls onFiltersApply when apply button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
        />
      )

      const searchInput = screen.getByLabelText('Search Tasks')
      await user.type(searchInput, 'test search')

      const applyButton = screen.getByRole('button', { name: /apply filters/i })
      await user.click(applyButton)

      await waitFor(() => {
        expect(mockOnFiltersApply).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'test search',
          })
        )
      })
    })
  })

  describe('Loading State', () => {
    it('disables all form fields when loading', () => {
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          isLoading={true}
        />
      )

      expect(screen.getByLabelText('Search Tasks')).toBeDisabled()
      expect(screen.getByLabelText('Priority')).toBeDisabled()
      expect(screen.getByLabelText('Assignee')).toBeDisabled()
      expect(screen.getByLabelText('Due Date From')).toBeDisabled()
      expect(screen.getByLabelText('Due Date To')).toBeDisabled()
      expect(screen.getByRole('checkbox', { name: /backlog/i })).toBeDisabled()
    })

    it('disables action buttons when loading', () => {
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          isLoading={true}
        />
      )

      expect(screen.getByRole('button', { name: /apply filters/i })).toBeDisabled()
    })

    it('displays loading text in search input helper', () => {
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          isLoading={true}
        />
      )

      expect(screen.getByText('Searching...')).toBeInTheDocument()
    })
  })

  describe('Combined Filters', () => {
    it('correctly combines all active filters', async () => {
      const user = userEvent.setup()
      render(
        <TaskFiltersPanel
          onFiltersApply={mockOnFiltersApply}
          assignees={mockAssignees}
          debounceMs={100}
        />
      )

      const searchInput = screen.getByLabelText('Search Tasks')
      const prioritySelect = screen.getByLabelText('Priority') as HTMLSelectElement
      const backlogCheckbox = screen.getByRole('checkbox', { name: /backlog/i })
      const assigneeSelect = screen.getByLabelText('Assignee') as HTMLSelectElement
      const dueDateFromInput = screen.getByLabelText('Due Date From')

      await user.type(searchInput, 'implement')
      await user.selectOptions(prioritySelect, 'high')
      await user.click(backlogCheckbox)
      await user.selectOptions(assigneeSelect, 'Alice')
      await user.type(dueDateFromInput, '2026-03-01')

      await waitFor(
        () => {
          expect(mockOnFiltersApply).toHaveBeenCalledWith({
            search: 'implement',
            priority: 'high',
            statuses: ['backlog'],
            assignee: 'Alice',
            dueDateFrom: '2026-03-01',
            dueDateTo: '',
          })
        },
        { timeout: 200 }
      )
    })
  })
})
