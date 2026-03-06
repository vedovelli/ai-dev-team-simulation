import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { RHFSelect } from './RHFSelect'

const meta = {
  title: 'Forms/RHFSelect',
  component: RHFSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RHFSelect>

export default meta
type Story = StoryObj<typeof meta>

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
]

function RHFSelectWrapper(props: any) {
  const { control } = useForm({
    defaultValues: {
      priority: '',
    },
  })

  return (
    <div className="w-96">
      <RHFSelect
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
  render: () => <RHFSelectWrapper />,
}

export const WithHelperText: Story = {
  render: () => (
    <RHFSelectWrapper helperText="Select the priority level for this task" />
  ),
}

export const WithDifferentOptions: Story = {
  render: () => {
    const { control } = useForm({
      defaultValues: {
        status: '',
      },
    })

    return (
      <div className="w-96">
        <RHFSelect
          control={control}
          name="status"
          label="Status"
          options={statusOptions}
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => <RHFSelectWrapper disabled />,
}

export const Required: Story = {
  render: () => <RHFSelectWrapper label="Priority Level *" />,
}

export const WithCustomPlaceholder: Story = {
  render: () => (
    <RHFSelectWrapper />
  ),
}
