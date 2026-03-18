import { createFileRoute } from '@tanstack/react-router'
import { ProfileSettingsPage } from '../../pages/settings/ProfileSettingsPage'

export const Route = createFileRoute('/settings/profile')({
  component: ProfileSettingsPage,
})
