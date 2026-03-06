import type { Meta, StoryObj } from '@storybook/react'
import { UserPreferencesForm } from './UserPreferencesForm'

const meta: Meta<typeof UserPreferencesForm> = {
  component: UserPreferencesForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Preferences saved:', data)
      await new Promise((resolve) => setTimeout(resolve, 500))
    },
    isLoading: false,
  },
}

export const WithInitialData: Story = {
  args: {
    initialData: {
      theme: 'dark',
      fontSize: 16,
      itemsPerPage: 50,
      emailNotifications: true,
      slackNotifications: true,
      notificationChannels: ['email', 'slack', 'push'],
      language: 'es',
      compactMode: true,
      showHints: false,
    },
    onSubmit: async (data) => {
      console.log('Preferences updated:', data)
      await new Promise((resolve) => setTimeout(resolve, 500))
    },
    isLoading: false,
  },
}

export const Loading: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    },
    isLoading: true,
  },
}

export const WithError: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      throw new Error('Failed to save preferences. Please try again.')
    },
    isLoading: false,
  },
  decorators: [
    (Story) => (
      <div>
        <p className="mb-4 text-sm text-red-600">
          Note: Submitting this form will show an error
        </p>
        <Story />
      </div>
    ),
  ],
}

export const Minimal: Story = {
  args: {
    initialData: {
      theme: 'light',
      fontSize: 14,
      itemsPerPage: 20,
      emailNotifications: false,
      slackNotifications: false,
      notificationChannels: ['email'],
      language: 'en',
      compactMode: false,
      showHints: true,
    },
    onSubmit: async () => {
      console.log('Minimal form submitted')
    },
    isLoading: false,
  },
}
