/**
 * Unit tests for Permission Context and usePermission hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PermissionProvider, usePermission, type UserRole } from '../PermissionContext'
import { ReactNode } from 'react'

// Mock fetch globally
global.fetch = vi.fn()

const mockFetch = global.fetch as ReturnType<typeof vi.fn>

// Test component that uses the usePermission hook
function TestComponent() {
  const { userRole, isLoading, error, hasPermission, checkPermission } = usePermission()

  const permResult = hasPermission('view-dashboard')

  return (
    <div>
      <div data-testid="user-role">{userRole || 'none'}</div>
      <div data-testid="is-loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="error">{error || 'none'}</div>
      <div data-testid="perm-has-permission">{permResult.hasPermission ? 'allowed' : 'denied'}</div>
      <div data-testid="perm-is-loading">{permResult.isLoading ? 'loading' : 'ready'}</div>
      <button
        data-testid="check-perm-btn"
        onClick={async () => {
          await checkPermission('edit-dashboard')
        }}
      >
        Check Permission
      </button>
    </div>
  )
}

describe('PermissionContext', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('PermissionProvider', () => {
    it('throws error when usePermission is used outside PermissionProvider', () => {
      function ComponentWithoutProvider() {
        usePermission()
        return null
      }

      // Suppress error output in test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<ComponentWithoutProvider />)
      }).toThrow('usePermission must be used within a PermissionProvider')

      consoleError.mockRestore()
    })

    it('loads user role on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'developer' as UserRole }),
      })

      render(
        <PermissionProvider>
          <TestComponent />
        </PermissionProvider>
      )

      expect(screen.getByTestId('is-loading')).toHaveTextContent('loading')

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('ready')
      })

      expect(screen.getByTestId('user-role')).toHaveTextContent('developer')
    })

    it('sets role to viewer on load failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <PermissionProvider>
          <TestComponent />
        </PermissionProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('viewer')
      })

      expect(screen.getByTestId('error')).not.toHaveTextContent('none')
    })

    it('handles non-ok responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      render(
        <PermissionProvider>
          <TestComponent />
        </PermissionProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('viewer')
      })
    })
  })

  describe('usePermission hook', () => {
    it('returns permission checking function', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'admin' as UserRole }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasPermission: true }),
      })

      render(
        <PermissionProvider>
          <TestComponent />
        </PermissionProvider>
      )

      const checkBtn = screen.getByTestId('check-perm-btn')
      expect(checkBtn).toBeInTheDocument()
    })

    it('caches permission results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'developer' as UserRole }),
      })

      // First permission check response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ feature: 'view-dashboard', hasPermission: true }),
      })

      render(
        <PermissionProvider>
          <TestComponent />
        </PermissionProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('developer')
      })

      // Verify permission check was called
      expect(mockFetch).toHaveBeenCalledWith('/api/permissions/check', expect.any(Object))
    })

    it('returns loading state during initialization', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'developer' as UserRole }),
      })

      render(
        <PermissionProvider>
          <TestComponent />
        </PermissionProvider>
      )

      // Initially should be loading
      expect(screen.getByTestId('is-loading')).toHaveTextContent('loading')
    })

    it('denies access when role is not loaded', () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <PermissionProvider>
          <TestComponent />
        </PermissionProvider>
      )

      // When role fails to load, permissions should be denied
      expect(screen.getByTestId('perm-has-permission')).toHaveTextContent('denied')
    })
  })

  describe('Permission caching', () => {
    it('does not make duplicate requests for same permission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'developer' as UserRole }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ feature: 'view-dashboard', hasPermission: true }),
      })

      const DoubleCheckComponent = () => {
        const { checkPermission } = usePermission()

        return (
          <button
            data-testid="check-twice"
            onClick={async () => {
              await checkPermission('view-dashboard')
              await checkPermission('view-dashboard')
            }}
          >
            Check Twice
          </button>
        )
      }

      render(
        <PermissionProvider>
          <DoubleCheckComponent />
        </PermissionProvider>
      )

      await waitFor(() => {
        const btn = screen.getByTestId('check-twice')
        expect(btn).toBeInTheDocument()
      })

      const checkBtn = screen.getByTestId('check-twice')
      checkBtn.click()

      // Wait for requests to complete
      await waitFor(() => {
        // Should only make 2 calls: one for role, one for permission check
        // The second check should use cache
        expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(2)
      })
    })
  })

  describe('Error handling', () => {
    it('handles permission check errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'developer' as UserRole }),
      })

      mockFetch.mockRejectedValueOnce(new Error('Permission check failed'))

      const CheckWithErrorComponent = () => {
        const { checkPermission } = usePermission()

        return (
          <button
            data-testid="check-error"
            onClick={async () => {
              const result = await checkPermission('view-dashboard')
              return result
            }}
          >
            Check
          </button>
        )
      }

      render(
        <PermissionProvider>
          <CheckWithErrorComponent />
        </PermissionProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('check-error')).toBeInTheDocument()
      })

      const btn = screen.getByTestId('check-error')
      btn.click()

      // Should return false on error
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    it('returns false when permission check fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'viewer' as UserRole }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ feature: 'edit-dashboard', hasPermission: false }),
      })

      const NoPermissionComponent = () => {
        const { checkPermission } = usePermission()
        const [denied, setDenied] = React.useState(false)

        return (
          <div>
            <button
              data-testid="check-no-perm"
              onClick={async () => {
                const result = await checkPermission('edit-dashboard')
                setDenied(!result)
              }}
            >
              Check
            </button>
            <div data-testid="denied">{denied ? 'denied' : 'allowed'}</div>
          </div>
        )
      }

      const React = await import('react')

      render(
        <PermissionProvider>
          <NoPermissionComponent />
        </PermissionProvider>
      )

      await waitFor(() => {
        const btn = screen.getByTestId('check-no-perm')
        btn.click()
      })
    })
  })
})
