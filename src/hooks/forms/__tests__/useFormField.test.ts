import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { useFormField } from '../useFormField'

describe('useFormField', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('basic field functionality', () => {
    it('should initialize field with default value', () => {
      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { email: '' },
        })

        return useFormField({
          control,
          name: 'email',
        })
      })

      expect(result.current.field.value).toBe('')
      expect(result.current.hasError).toBe(false)
    })

    it('should update field value when changed', () => {
      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { username: '' },
        })

        return useFormField({
          control,
          name: 'username',
        })
      })

      act(() => {
        result.current.field.onChange('new_username')
      })

      expect(result.current.field.value).toBe('new_username')
    })

    it('should report sync validation errors', async () => {
      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { email: 'invalid' },
          mode: 'onChange',
        })

        return useFormField({
          control,
          name: 'email',
          rules: {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email format',
            },
          },
        })
      })

      expect(result.current.hasError).toBe(true)
      await waitFor(() => {
        expect(result.current.errorMessage).toBeDefined()
      })
    })
  })

  describe('async validation', () => {
    it('should validate field asynchronously', async () => {
      vi.useFakeTimers()

      const mockValidator = vi.fn(async (value: string) => {
        if (value === 'taken') {
          return 'Username is taken'
        }
        return undefined
      })

      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { username: '' },
        })

        return useFormField({
          control,
          name: 'username',
          asyncValidate: mockValidator,
          asyncValidatorConfig: { debounce: 300 },
        })
      })

      act(() => {
        result.current.field.onChange('available_username')
      })

      // Should be validating after debounce
      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false)
      })

      expect(mockValidator).toHaveBeenCalledWith('available_username')

      vi.useRealTimers()
    })

    it('should debounce async validation calls', async () => {
      vi.useFakeTimers()

      const mockValidator = vi.fn(async () => undefined)

      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { username: '' },
        })

        return useFormField({
          control,
          name: 'username',
          asyncValidate: mockValidator,
          asyncValidatorConfig: { debounce: 300 },
        })
      })

      // Simulate rapid changes
      act(() => {
        result.current.field.onChange('a')
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      act(() => {
        result.current.field.onChange('ab')
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      act(() => {
        result.current.field.onChange('abc')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false)
      })

      // Should only call validator once with final value
      expect(mockValidator).toHaveBeenCalledTimes(1)
      expect(mockValidator).toHaveBeenCalledWith('abc')

      vi.useRealTimers()
    })

    it('should set async error when validation fails', async () => {
      vi.useFakeTimers()

      const mockValidator = vi.fn(async (value: string) => {
        if (value === 'taken') {
          return 'This username is already taken'
        }
        return undefined
      })

      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { username: '' },
        })

        return useFormField({
          control,
          name: 'username',
          asyncValidate: mockValidator,
          asyncValidatorConfig: { debounce: 300 },
        })
      })

      act(() => {
        result.current.field.onChange('taken')
      })

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false)
      })

      expect(result.current.fieldState.asyncError).toBe('This username is already taken')
      expect(result.current.hasError).toBe(true)

      vi.useRealTimers()
    })

    it('should handle async validation errors gracefully', async () => {
      vi.useFakeTimers()

      const mockValidator = vi.fn(async () => {
        throw new Error('Network error')
      })

      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { username: '' },
        })

        return useFormField({
          control,
          name: 'username',
          asyncValidate: mockValidator,
          asyncValidatorConfig: { debounce: 300 },
        })
      })

      act(() => {
        result.current.field.onChange('test')
      })

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false)
      })

      expect(result.current.fieldState.asyncError).toBe('Validation error')

      vi.useRealTimers()
    })

    it('should use custom debounce delay', async () => {
      vi.useFakeTimers()

      const mockValidator = vi.fn(async () => undefined)

      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { username: '' },
        })

        return useFormField({
          control,
          name: 'username',
          asyncValidate: mockValidator,
          asyncValidatorConfig: { debounce: 500 },
        })
      })

      act(() => {
        result.current.field.onChange('test')
      })

      // Should not validate at 300ms
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(mockValidator).not.toHaveBeenCalled()

      // Should validate at 500ms
      act(() => {
        vi.advanceTimersByTime(200)
      })

      await waitFor(() => {
        expect(mockValidator).toHaveBeenCalled()
      })

      vi.useRealTimers()
    })

    it('should clear debounce on unmount', () => {
      vi.useFakeTimers()

      const mockValidator = vi.fn(async () => undefined)

      const { unmount } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { username: '' },
        })

        return useFormField({
          control,
          name: 'username',
          asyncValidate: mockValidator,
          asyncValidatorConfig: { debounce: 300 },
        })
      })

      unmount()

      vi.advanceTimersByTime(300)

      // Validator should not be called after unmount
      expect(mockValidator).not.toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('combined sync and async validation', () => {
    it('should show sync error before running async validation', async () => {
      vi.useFakeTimers()

      const mockValidator = vi.fn(async () => undefined)

      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { username: '' },
          mode: 'onChange',
        })

        return useFormField({
          control,
          name: 'username',
          rules: {
            required: 'Username is required',
            minLength: {
              value: 3,
              message: 'Minimum 3 characters',
            },
          },
          asyncValidate: mockValidator,
          asyncValidatorConfig: { debounce: 300 },
        })
      })

      act(() => {
        result.current.field.onChange('ab')
      })

      // Sync error should be shown immediately
      expect(result.current.fieldState.error?.message).toBe('Minimum 3 characters')

      vi.advanceTimersByTime(300)

      // Async validation should not be called due to sync error
      expect(mockValidator).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('should run async validation when sync validation passes', async () => {
      vi.useFakeTimers()

      const mockValidator = vi.fn(async (value: string) => {
        if (value === 'taken') {
          return 'Username is taken'
        }
        return undefined
      })

      const { result } = renderHook(() => {
        const { control } = useForm({
          defaultValues: { username: '' },
          mode: 'onChange',
        })

        return useFormField({
          control,
          name: 'username',
          rules: {
            minLength: {
              value: 3,
              message: 'Minimum 3 characters',
            },
          },
          asyncValidate: mockValidator,
          asyncValidatorConfig: { debounce: 300 },
        })
      })

      act(() => {
        result.current.field.onChange('available')
      })

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false)
      })

      expect(mockValidator).toHaveBeenCalledWith('available')
      expect(result.current.fieldState.asyncError).toBeUndefined()

      vi.useRealTimers()
    })
  })
})
