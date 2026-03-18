import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SettingsLayout } from '../../components/SettingsLayout/SettingsLayout'

export const Route = createFileRoute('/settings/')({
  component: SettingsLayoutRoute,
})

function SettingsLayoutRoute() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  )
}
