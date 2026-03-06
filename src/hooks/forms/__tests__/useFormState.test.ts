import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { z } from 'zod'
import { useFormState, FormSubmissionResult } from '../useFormState'

describe('useFormState', () => {
  const mockSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password too short'),
    name: z.string().min(1, 'Name is required'),
  })

  type FormData = z.infer<typeof mockSchema>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize form with default values', () => {
    const defaultValues: FormData = {
      email: '',
      password: '',
      name: '',
    }

    const mockOnSubmit = vi.fn()

    const { result } = renderHook(() =>
      useFormState({
        defaultValues,
        schema: mockSchema,
        onSubmit: mockOnSubmit,
      }),
    )

    expect(result.current.form.state.values).toEqual(defaultValues)
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should update field values', () => {
    const defaultValues: FormData = {
      email: '',
      password: '',
      name: '',
    }

    const mockOnSubmit = vi.fn()

    const { result } = renderHook(() =>
      useFormState({
        defaultValues,
        schema: mockSchema,
        onSubmit: mockOnSubmit,
      }),
    )

    act(() => {
      result.current.setFieldValue('email', 'test@example.com')
    })

    expect(result.current.form.state.values.email).toBe('test@example.com')
  })

  it('should validate client-side errors', async () => {
    const defaultValues: FormData = {
      email: 'invalid-email',
      password: 'short',
      name: '',
    }

    const mockOnSubmit = vi.fn()

    const { result } = renderHook(() =>
      useFormState({
        defaultValues,
        schema: mockSchema,
        onSubmit: mockOnSubmit,
      }),
    )

    await act(async () => {
      result.current.form.validateAllFields('change')
    })

    await waitFor(() => {
      expect(Object.keys(result.current.fieldErrors).length).toBeGreaterThan(0)
    })
  })

  it('should handle successful form submission', async () => {
    const defaultValues: FormData = {
      email: 'test@example.com',
      password: 'ValidPassword123',
      name: 'John Doe',
    }

    const mockOnSubmit = vi.fn(async (): Promise<FormSubmissionResult<FormData>> => ({
      success: true,
      data: defaultValues,
    }))

    const { result } = renderHook(() =>
      useFormState({
        defaultValues,
        schema: mockSchema,
        onSubmit: mockOnSubmit,
      }),
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockOnSubmit).toHaveBeenCalledWith(defaultValues)
  })

  it('should handle server-side field errors', async () => {
    const defaultValues: FormData = {
      email: 'existing@example.com',
      password: 'ValidPassword123',
      name: 'John Doe',
    }

    const mockOnSubmit = vi.fn(async (): Promise<FormSubmissionResult<FormData>> => ({
      success: false,
      fieldErrors: {
        email: ['Email already registered'],
      },
      serverError: 'Validation failed',
    }))

    const { result } = renderHook(() =>
      useFormState({
        defaultValues,
        schema: mockSchema,
        onSubmit: mockOnSubmit,
      }),
    )

    await act(async () => {
      try {
        await result.current.handleSubmit()
      } catch {
        // Expected to throw
      }
    })

    expect(result.current.submitError).toBe('Validation failed')
  })

  it('should get field-specific errors', async () => {
    const defaultValues: FormData = {
      email: 'invalid-email',
      password: 'short',
      name: '',
    }

    const mockOnSubmit = vi.fn()

    const { result } = renderHook(() =>
      useFormState({
        defaultValues,
        schema: mockSchema,
        onSubmit: mockOnSubmit,
      }),
    )

    await act(async () => {
      result.current.form.validateAllFields('change')
    })

    await waitFor(() => {
      const emailError = result.current.getFieldError('email')
      expect(emailError).toBeDefined()
    })
  })

  it('should reset form to default values', () => {
    const defaultValues: FormData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'John',
    }

    const mockOnSubmit = vi.fn()

    const { result } = renderHook(() =>
      useFormState({
        defaultValues,
        schema: mockSchema,
        onSubmit: mockOnSubmit,
      }),
    )

    act(() => {
      result.current.setFieldValue('email', 'different@example.com')
    })

    expect(result.current.form.state.values.email).toBe('different@example.com')

    act(() => {
      result.current.reset()
    })

    expect(result.current.form.state.values).toEqual(defaultValues)
  })

  it('should call onError when submission fails', async () => {
    const defaultValues: FormData = {
      email: 'test@example.com',
      password: 'ValidPassword123',
      name: 'John Doe',
    }

    const mockOnError = vi.fn()
    const mockOnSubmit = vi.fn(async (): Promise<FormSubmissionResult<FormData>> => {
      throw new Error('Network error')
    })

    const { result } = renderHook(() =>
      useFormState({
        defaultValues,
        schema: mockSchema,
        onSubmit: mockOnSubmit,
        onError: mockOnError,
      }),
    )

    await act(async () => {
      try {
        await result.current.handleSubmit()
      } catch {
        // Expected to throw
      }
    })

    expect(mockOnError).toHaveBeenCalledWith('Network error')
  })

  it('should track submitting state', async () => {
    const defaultValues: FormData = {
      email: 'test@example.com',
      password: 'ValidPassword123',
      name: 'John Doe',
    }

    const mockOnSubmit = vi.fn(async (): Promise<FormSubmissionResult<FormData>> => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return {
        success: true,
        data: defaultValues,
      }
    })

    const { result } = renderHook(() =>
      useFormState({
        defaultValues,
        schema: mockSchema,
        onSubmit: mockOnSubmit,
      }),
    )

    expect(result.current.isSubmitting).toBe(false)

    await act(async () => {
      result.current.handleSubmit()
      await waitFor(() => {
        // Wait for submission to complete
      })
    })
  })
})
