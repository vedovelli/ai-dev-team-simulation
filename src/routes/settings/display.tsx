import { createFileRoute } from '@tanstack/react-router'
import { DisplaySettingsPage } from '../../pages/settings/DisplaySettingsPage'

export const Route = createFileRoute('/settings/display')({
  component: DisplaySettingsPage,
})
