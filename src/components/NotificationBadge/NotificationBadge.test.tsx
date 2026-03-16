/**
 * Unit tests for NotificationBadge component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationBadge } from './NotificationBadge'
import * as notificationsModule from '../../hooks/useNotifications'

// Mock the useNotifications hook
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}))

const mockUseNotifications = notificationsModule.useNotifications as ReturnType<
  typeof vi.fn
>

describe('NotificationBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders a button with bell icon', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const button = screen.getByRole('button', { name: /notifications/i })
      expect(button).toBeInTheDocument()

      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('renders with proper accessibility attributes', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
      expect(button).toHaveAttribute('aria-label', 'Notifications')
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Unread Count Display', () => {
    it('does not show badge when unread count is 0', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const badge = screen.queryByText('0')
      expect(badge).not.toBeInTheDocument()
    })

    it('shows badge with unread count when count > 0', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 5,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const badge = screen.getByText('5')
      expect(badge).toBeInTheDocument()
    })

    it('shows "9+" when unread count exceeds 9', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 15,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const badge = screen.getByText('9+')
      expect(badge).toBeInTheDocument()
    })

    it('displays correct aria-label for single unread notification', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 1,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const button = screen.getByRole('button', {
        name: /1 unread notification/i,
      })
      expect(button).toBeInTheDocument()
    })

    it('displays correct aria-label for multiple unread notifications', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 5,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const button = screen.getByRole('button', {
        name: /5 unread notifications/i,
      })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('disables button while loading', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        isLoading: true,
      })

      render(<NotificationBadge />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('applies opacity styling when disabled', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        isLoading: true,
      })

      render(<NotificationBadge />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('opacity-50')
      expect(button).toHaveClass('cursor-not-allowed')
    })
  })

  describe('Animation and Visual States', () => {
    it('shows animated pulse dot when badge is visible', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 3,
        isLoading: false,
      })

      const { container } = render(<NotificationBadge />)

      // Look for the pulse animation span
      const pulseSpan = container.querySelector('.animate-pulse')
      expect(pulseSpan).toBeInTheDocument()
    })

    it('sets aria-pressed to true when badge is visible', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 2,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Interaction', () => {
    it('calls onClick callback when clicked', () => {
      const handleClick = vi.fn()
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        isLoading: false,
      })

      render(<NotificationBadge onClick={handleClick} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn()
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        isLoading: true,
      })

      render(<NotificationBadge onClick={handleClick} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className prop', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        isLoading: false,
      })

      const { container } = render(
        <NotificationBadge className="custom-class" />
      )

      const button = container.querySelector('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Edge Cases', () => {
    it('handles exactly 9 unread notifications correctly', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 9,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const badge = screen.getByText('9')
      expect(badge).toBeInTheDocument()
      // Should NOT show "9+"
      expect(screen.queryByText('9+')).not.toBeInTheDocument()
    })

    it('handles very large unread count (99+)', () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 999,
        isLoading: false,
      })

      render(<NotificationBadge />)

      const badge = screen.getByText('9+')
      expect(badge).toBeInTheDocument()
    })
  })
})
