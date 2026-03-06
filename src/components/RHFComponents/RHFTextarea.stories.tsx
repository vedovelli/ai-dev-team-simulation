import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { RHFTextarea } from './RHFTextarea'

const meta = {
  title: 'Forms/RHFTextarea',
  component: RHFTextarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RHFTextarea>

export default meta
type Story = StoryObj<typeof meta>

function RHFTextareaWrapper(props: any) {
  const { control } = useForm({
    defaultValues: {
      description: '',
    },
  })

  return (
    <div className="w-96">
      <RHFTextarea
        control={control}
        name="description"
        label="Description"
        placeholder="Enter a detailed description"
        rows={4}
        {...props}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => <RHFTextareaWrapper />,
}

export const WithHelperText: Story = {
  render: () => (
    <RHFTextareaWrapper helperText="Please provide as much detail as possible" />
  ),
}

export const SmallRows: Story = {
  render: () => (
    <RHFTextareaWrapper rows={2} placeholder="Enter a short note" />
  ),
}

export const LargeRows: Story = {
  render: () => (
    <RHFTextareaWrapper rows={8} placeholder="Enter a lengthy description" />
  ),
}

export const Disabled: Story = {
  render: () => <RHFTextareaWrapper disabled />,
}

export const Required: Story = {
  render: () => <RHFTextareaWrapper label="Description *" />,
}

export const WithDefaultValue: Story = {
  render: () => {
    const { control } = useForm({
      defaultValues: {
        description: 'This is a pre-filled description that shows as the default value.',
      },
    })

    return (
      <div className="w-96">
        <RHFTextarea
          control={control}
          name="description"
          label="Description"
          rows={4}
        />
      </div>
    )
  },
}
