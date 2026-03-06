import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { RHFRadio } from './RHFRadio'

const meta = {
  title: 'Forms/RHFRadio',
  component: RHFRadio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RHFRadio>

export default meta
type Story = StoryObj<typeof meta>

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const frequencyOptions = [
  {
    value: 'daily',
    label: 'Daily',
    description: 'Receive updates every day',
  },
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Receive updates once a week',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Receive updates once a month',
  },
]

function RHFRadioWrapper(props: any) {
  const { control } = useForm({
    defaultValues: {
      priority: 'medium',
    },
  })

  return (
    <div className="w-96">
      <RHFRadio
        control={control}
        name="priority"
        label="Priority Level"
        options={priorityOptions}
        {...props}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => <RHFRadioWrapper />,
}

export const WithHelperText: Story = {
  render: () => (
    <RHFRadioWrapper helperText="Select the priority level for this task" />
  ),
}

export const WithDescriptions: Story = {
  render: () => {
    const { control } = useForm({
      defaultValues: {
        frequency: 'weekly',
      },
    })

    return (
      <div className="w-96">
        <RHFRadio
          control={control}
          name="frequency"
          label="Update Frequency"
          options={frequencyOptions}
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => <RHFRadioWrapper disabled />,
}

export const Required: Story = {
  render: () => <RHFRadioWrapper label="Priority Level *" />,
}

export const VerticalLayout: Story = {
  render: () => {
    const { control } = useForm({
      defaultValues: {
        option: 'option1',
      },
    })

    return (
      <div className="w-96">
        <RHFRadio
          control={control}
          name="option"
          label="Select an option"
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3' },
          ]}
        />
      </div>
    )
  },
}
