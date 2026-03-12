import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConflictModal, type ConflictState } from './ConflictModal'

describe('ConflictModal', () => {
  const mockConflictState: ConflictState = {
    hasConflict: true,
    localVersion: {
      title: 'Updated Title',
      status: 'in-progress',
      priority: 'high',
    },
    serverVersion: {
      title: 'Original Title',
      status: 'backlog',
      priority: 'normal',
    },
  }

  it('should render when isOpen is true', () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Conflict Detected')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()

    const { container } = render(
      <ConflictModal
        isOpen={false}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should display title, local version, and server version', () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    expect(screen.getByText('Your Changes')).toBeInTheDocument()
    expect(screen.getByText('Server Version')).toBeInTheDocument()
    expect(screen.getByText('Updated Title')).toBeInTheDocument()
    expect(screen.getByText('Original Title')).toBeInTheDocument()
  })

  it('should show warning about overwriting when visible', () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    expect(
      screen.getByText(/may overwrite recent updates by your teammate/)
    ).toBeInTheDocument()
  })

  it('should call onResolve with "reload" when "Use Server Version" is clicked', async () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    const useServerButton = screen.getByText('Use Server Version')
    await user.click(useServerButton)

    expect(onResolve).toHaveBeenCalledWith('reload')
  })

  it('should call onResolve with "override" when "Keep My Changes" is clicked', async () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    const keepChangesButton = screen.getByText('Keep My Changes')
    await user.click(keepChangesButton)

    expect(onResolve).toHaveBeenCalledWith('override')
  })

  it('should call onCancel when "Cancel" button is clicked', async () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(onCancel).toHaveBeenCalled()
  })

  it('should call onCancel when Escape key is pressed', async () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onCancel).toHaveBeenCalled()
  })

  it('should call onCancel when backdrop is clicked', async () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    const backdrop = screen.getByRole('dialog').parentElement
    if (backdrop) {
      await user.click(backdrop)
    }

    expect(onCancel).toHaveBeenCalled()
  })

  it('should have proper ARIA attributes', () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'conflict-modal-title')
  })

  it('should focus first button when opened', async () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    await waitFor(() => {
      const useServerButton = screen.getByText('Use Server Version')
      expect(useServerButton).toHaveFocus()
    })
  })

  it('should handle null/undefined values in diff', () => {
    const conflictStateWithNull: ConflictState = {
      hasConflict: true,
      localVersion: {
        title: 'New Title',
        description: null,
      },
      serverVersion: {
        title: 'Old Title',
        description: undefined,
      },
    }

    const onResolve = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={conflictStateWithNull}
        onResolve={onResolve}
        onCancel={onCancel}
      />
    )

    const dashPlaceholders = screen.getAllByText('—')
    expect(dashPlaceholders.length).toBeGreaterThan(0)
  })

  it('should display correct entity type in message', () => {
    const onResolve = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConflictModal
        isOpen={true}
        conflictState={mockConflictState}
        onResolve={onResolve}
        onCancel={onCancel}
        entityType="sprint"
      />
    )

    expect(screen.getByText(/This sprint was updated/)).toBeInTheDocument()
  })
})
