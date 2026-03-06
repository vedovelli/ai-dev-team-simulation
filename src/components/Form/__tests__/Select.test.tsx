import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '../Select'

interface SelectOption {
  value: string
  label: string
}

const createMockField = (value = '', errors = [] as string[]) => ({
  name: 'status',
  state: {
    value,
    meta: {
      errors,
      isTouched: false,
      isDirty: false,
      isValidating: false,
    },
  },
  handleChange: vi.fn(),
  handleBlur: vi.fn(),
})

const options: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
]

describe('Select Component', () => {
  it('renders select element', () => {
    const field = createMockField()

    render(
      <Select field={field as any} options={options} />
    )

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    const field = createMockField()

    render(
      <Select field={field as any} label="Status" options={options} />
    )

    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders placeholder option', () => {
    const field = createMockField()

    render(
      <Select
        field={field as any}
        options={options}
        placeholder="Select a status"
      />
    )

    expect(screen.getByText('Select a status')).toBeInTheDocument()
  })

  it('renders all option values', () => {
    const field = createMockField()

    render(
      <Select field={field as any} options={options} />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('displays validation errors', () => {
    const field = createMockField('', ['Status is required'])

    render(
      <Select field={field as any} label="Status" options={options} />
    )

    expect(screen.getByText('Status is required')).toBeInTheDocument()
  })

  it('calls handleChange with string value on single select', () => {
    const mockHandleChange = vi.fn()
    const field = createMockField()
    field.handleChange = mockHandleChange

    render(
      <Select field={field as any} options={options} />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'active' } })

    expect(mockHandleChange).toHaveBeenCalledWith('active')
  })

  it('calls handleBlur on blur event', () => {
    const mockHandleBlur = vi.fn()
    const field = createMockField()
    field.handleBlur = mockHandleBlur

    render(
      <Select field={field as any} options={options} />
    )

    const select = screen.getByRole('combobox')
    fireEvent.blur(select)

    expect(mockHandleBlur).toHaveBeenCalled()
  })

  it('displays selected value', () => {
    const field = createMockField('active')

    render(
      <Select field={field as any} options={options} />
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('active')
  })

  it('renders help text when provided', () => {
    const field = createMockField()

    render(
      <Select
        field={field as any}
        label="Status"
        options={options}
        helpText="Choose current status"
      />
    )

    expect(screen.getByText('Choose current status')).toBeInTheDocument()
  })

  it('supports multiple selection', () => {
    const mockHandleChange = vi.fn()
    const field = createMockField([], [])
    field.handleChange = mockHandleChange

    render(
      <Select field={field as any} options={options} multiple />
    )

    const select = screen.getByRole('listbox')
    expect(select).toHaveAttribute('multiple')
  })

  it('handles multiple selection by passing array', () => {
    const mockHandleChange = vi.fn()
    const field = createMockField([], [])
    field.handleChange = mockHandleChange

    const { container } = render(
      <Select field={field as any} options={options} multiple />
    )

    const select = container.querySelector('select') as HTMLSelectElement
    fireEvent.change(select, { target: { selectedOptions: [options[0], options[1]] } })

    expect(mockHandleChange).toHaveBeenCalled()
    const callArgs = mockHandleChange.mock.calls[0][0]
    expect(Array.isArray(callArgs)).toBe(true)
  })

  it('does not show placeholder in multiple mode', () => {
    const field = createMockField([], [])

    render(
      <Select
        field={field as any}
        options={options}
        placeholder="Select options"
        multiple
      />
    )

    const placeholderOptions = screen.queryAllByText('Select options')
    expect(placeholderOptions.length).toBe(0)
  })
})
