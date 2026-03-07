/**
 * Unit tests for ProtectedRoute component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ProtectedRoute } from '../ProtectedRoute'
import { PermissionProvider } from '../../contexts/PermissionContext'
import { RouterProvider, createRouter, RootRoute, Route } from '@tanstack/react-router'
import React from 'react'

// Mock fetch
global.fetch = vi.fn()
const mockFetch = global.fetch as ReturnType<typeof vi.fn>

// Mock useNavigate
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('shows loading state while checking permissions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 'developer' }),
    })

    // Mock slow permission check
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ hasPermission: true }),
            })
          }, 100)
        })
    )

    const { rerender } = render(
      <PermissionProvider>
        <ProtectedRoute requiredPermission="view-dashboard">
          <div>Protected Content</div>
        </ProtectedRoute>
      </PermissionProvider>
    )

    // Should show loading state initially
    expect(screen.getByText(/Verifying permissions/i)).toBeInTheDocument()

    // Wait for permission check to complete
    await waitFor(() => {
      expect(screen.queryByText(/Verifying permissions/i)).not.toBeInTheDocument()
    })
  })

  it('renders children when user has permission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 'admin' }),
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasPermission: true }),
    })

    render(
      <PermissionProvider>
        <ProtectedRoute requiredPermission="view-dashboard">
          <div>Protected Content</div>
        </ProtectedRoute>
      </PermissionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('does not render children when user lacks permission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 'viewer' }),
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasPermission: false }),
    })

    render(
      <PermissionProvider>
        <ProtectedRoute requiredPermission="manage-users">
          <div>Protected Content</div>
        </ProtectedRoute>
      </PermissionProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  it('uses custom fallback when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 'developer' }),
    })

    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ hasPermission: true }),
            })
          }, 50)
        })
    )

    render(
      <PermissionProvider>
        <ProtectedRoute
          requiredPermission="view-dashboard"
          fallback={<div>Custom Loading...</div>}
        >
          <div>Protected Content</div>
        </ProtectedRoute>
      </PermissionProvider>
    )

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('calls checkPermission with correct feature', async () => {
    const requiredPermission = 'edit-dashboard'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 'developer' }),
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasPermission: true }),
    })

    render(
      <PermissionProvider>
        <ProtectedRoute requiredPermission={requiredPermission}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </PermissionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    // Verify the permission check endpoint was called with correct feature
    const permCheckCall = mockFetch.mock.calls.find(
      (call) => call[0] === '/api/permissions/check'
    )
    expect(permCheckCall).toBeDefined()
    if (permCheckCall) {
      const body = JSON.parse(permCheckCall[1].body)
      expect(body.feature).toBe(requiredPermission)
    }
  })

  it('handles permission check errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 'developer' }),
    })

    mockFetch.mockRejectedValueOnce(new Error('Permission check failed'))

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <PermissionProvider>
        <ProtectedRoute requiredPermission="view-dashboard">
          <div>Protected Content</div>
        </ProtectedRoute>
      </PermissionProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    consoleError.mockRestore()
  })

  it('handles different permission scenarios', async () => {
    const scenarios = [
      { role: 'admin', permission: 'view-dashboard', expected: true },
      { role: 'developer', permission: 'view-dashboard', expected: true },
      { role: 'viewer', permission: 'edit-dashboard', expected: false },
      { role: 'viewer', permission: 'view-dashboard', expected: true },
    ]

    for (const scenario of scenarios) {
      mockFetch.mockClear()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: scenario.role }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasPermission: scenario.expected }),
      })

      const { unmount } = render(
        <PermissionProvider>
          <ProtectedRoute requiredPermission={scenario.permission}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </PermissionProvider>
      )

      await waitFor(() => {
        if (scenario.expected) {
          expect(screen.getByText('Protected Content')).toBeInTheDocument()
        } else {
          expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
        }
      })

      unmount()
    }
  })

  it('handles loading state display', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: 'developer' }),
    })

    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ hasPermission: true }),
            })
          }, 200)
        })
    )

    render(
      <PermissionProvider>
        <ProtectedRoute requiredPermission="view-dashboard">
          <div>Protected Content</div>
        </ProtectedRoute>
      </PermissionProvider>
    )

    // Check loading state exists
    const loadingText = screen.getByText(/Verifying permissions/i)
    expect(loadingText).toBeInTheDocument()

    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByText(/Verifying permissions/i)).not.toBeInTheDocument()
    })
  })
})
