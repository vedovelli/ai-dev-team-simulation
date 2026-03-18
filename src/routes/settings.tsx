import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SettingsLayout } from '../components/SettingsLayout/SettingsLayout'

/**
 * Settings layout route
 * All settings sub-routes (profile, notifications, display) use this layout
 */
export const Route = createFileRoute('/settings')({
  component: () => (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  ),
})
