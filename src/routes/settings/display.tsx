import { createFileRoute } from '@tanstack/react-router'
import { DisplaySettingsPage } from '../../pages/settings/DisplaySettingsPage'

/**
 * Display Settings Route
 * Allows users to manage theme, language, and timezone preferences
 */
export const Route = createFileRoute('/settings/display')({
  component: DisplaySettingsPage,
})
