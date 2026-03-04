import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from '../FormField'

// Mock FieldApi for testing
const createMockField = (name = 'testField', errors = [] as string[]) => ({
  name,
  state: {
    value: '',
    meta: {
      errors,
      isTouched: false,
      isDirty: false,
      isValidating: false,
    },
  },
})

describe('FormField Component', () => {
  it('renders children', () => {
    const field = createMockField()

    render(
      <FormField field={field as any}>
        <input type="text" placeholder="Test input" />
      </FormField>
    )

    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    const field = createMockField()

    render(
      <FormField field={field as any} label="Test Label">
        <input type="text" />
      </FormField>
    )

    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('does not render label when not provided', () => {
    const field = createMockField()

    render(
      <FormField field={field as any}>
        <input type="text" />
      </FormField>
    )

    expect(screen.queryByText('Test Label')).not.toBeInTheDocument()
  })

  it('displays error message when field has errors', () => {
    const field = createMockField('testField', ['This field is required'])

    render(
      <FormField field={field as any} label="Test Label">
        <input type="text" />
      </FormField>
    )

    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('displays only first error when multiple errors exist', () => {
    const field = createMockField('testField', ['Error 1', 'Error 2', 'Error 3'])

    render(
      <FormField field={field as any}>
        <input type="text" />
      </FormField>
    )

    expect(screen.getByText('Error 1')).toBeInTheDocument()
    expect(screen.queryByText('Error 2')).not.toBeInTheDocument()
  })

  it('applies error styling when field has errors', () => {
    const field = createMockField('testField', ['Error message'])

    const { container } = render(
      <FormField field={field as any}>
        <input type="text" />
      </FormField>
    )

    const errorDiv = container.querySelector('.text-red-600')
    expect(errorDiv).toBeInTheDocument()
  })
})
