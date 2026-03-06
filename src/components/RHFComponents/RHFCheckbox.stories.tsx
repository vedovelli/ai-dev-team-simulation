import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { RHFCheckbox } from './RHFCheckbox'

const meta = {
  title: 'Forms/RHFCheckbox',
  component: RHFCheckbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RHFCheckbox>

export default meta
type Story = StoryObj<typeof meta>

function RHFCheckboxWrapper(props: any) {
  const { control } = useForm({
    defaultValues: {
      agreeToTerms: false,
    },
  })

  return (
    <div className="w-96">
      <RHFCheckbox
        control={control}
        name="agreeToTerms"
        label="I agree to the terms and conditions"
        {...props}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => <RHFCheckboxWrapper />,
}

export const WithHelperText: Story = {
  render: () => (
    <RHFCheckboxWrapper helperText="You must agree to continue" />
  ),
}

export const Disabled: Story = {
  render: () => <RHFCheckboxWrapper disabled />,
}

export const Required: Story = {
  render: () => <RHFCheckboxWrapper label="I agree to the terms *" />,
}

export const MultipleCheckboxes: Story = {
  render: () => {
    const { control } = useForm({
      defaultValues: {
        notifications: false,
        newsletter: false,
        sms: false,
      },
    })

    return (
      <div className="w-96 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Notification Preferences
          </h3>
          <div className="space-y-2">
            <RHFCheckbox
              control={control}
              name="notifications"
              label="Email notifications"
            />
            <RHFCheckbox
              control={control}
              name="newsletter"
              label="Weekly newsletter"
            />
            <RHFCheckbox control={control} name="sms" label="SMS alerts" />
          </div>
        </div>
      </div>
    )
  },
}
