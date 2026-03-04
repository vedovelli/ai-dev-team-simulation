import { RegisterOptions } from 'react-hook-form'

/**
 * Validation rules for common field types
 */
export const validationRules = {
  /**
   * Required field validation
   * @example
   * ```tsx
   * <input {...register('name', validationRules.required)} />
   * ```
   */
  required: (fieldName = 'This field') => ({
    required: `${fieldName} is required`,
  } as RegisterOptions),

  /**
   * Email field validation
   * @example
   * ```tsx
   * <input type="email" {...register('email', validationRules.email)} />
   * ```
   */
  email: (customMessage?: string) => ({
    required: 'Email is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: customMessage || 'Must be a valid email address',
    },
  } as RegisterOptions),

  /**
   * Minimum length validation
   * @example
   * ```tsx
   * <input {...register('password', validationRules.minLength(8))} />
   * ```
   */
  minLength: (length: number, fieldName = 'Field') => ({
    required: `${fieldName} is required`,
    minLength: {
      value: length,
      message: `${fieldName} must be at least ${length} characters`,
    },
  } as RegisterOptions),

  /**
   * Maximum length validation
   * @example
   * ```tsx
   * <textarea {...register('bio', validationRules.maxLength(500))} />
   * ```
   */
  maxLength: (length: number, fieldName = 'Field') => ({
    required: `${fieldName} is required`,
    maxLength: {
      value: length,
      message: `${fieldName} must not exceed ${length} characters`,
    },
  } as RegisterOptions),

  /**
   * Password field validation (min 8 chars, requires uppercase, lowercase, number)
   * @example
   * ```tsx
   * <input type="password" {...register('password', validationRules.password)} />
   * ```
   */
  password: () => ({
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must contain uppercase, lowercase, and numbers',
    },
  } as RegisterOptions),

  /**
   * URL field validation
   * @example
   * ```tsx
   * <input type="url" {...register('website', validationRules.url)} />
   * ```
   */
  url: (customMessage?: string) => ({
    required: 'URL is required',
    pattern: {
      value: /^https?:\/\/.+\..+/,
      message: customMessage || 'Must be a valid URL',
    },
  } as RegisterOptions),

  /**
   * Phone number validation (basic pattern)
   * @example
   * ```tsx
   * <input type="tel" {...register('phone', validationRules.phone)} />
   * ```
   */
  phone: () => ({
    required: 'Phone number is required',
    pattern: {
      value: /^[\d\s\-\+\(\)]+$/,
      message: 'Must be a valid phone number',
    },
  } as RegisterOptions),
}

/**
 * Custom hook for creating composed validation rules
 * @example
 * ```tsx
 * const { required, email } = useValidation()
 * const rules = useValidation.compose(
 *   validationRules.required('Username'),
 *   validationRules.minLength(3)
 * )
 * ```
 */
export const useValidation = {
  rules: validationRules,

  /**
   * Compose multiple validation rules into one
   * @example
   * ```tsx
   * const composedRules = useValidation.compose(
   *   validationRules.required('Email'),
   *   validationRules.email()
   * )
   * ```
   */
  compose: (...ruleObjects: RegisterOptions[]): RegisterOptions => {
    return ruleObjects.reduce(
      (acc, rules) => ({
        ...acc,
        ...rules,
      }),
      {} as RegisterOptions,
    )
  },

  /**
   * Create a custom async validator
   * @example
   * ```tsx
   * const checkEmailUnique = useValidation.async(async (value) => {
   *   const exists = await api.checkEmail(value)
   *   return !exists || 'Email already in use'
   * })
   * ```
   */
  async: (
    validator: (value: any) => Promise<boolean | string>,
  ): RegisterOptions['validate'] => {
    return async (value) => {
      const result = await validator(value)
      return result === true ? true : result === false ? 'Validation failed' : result
    }
  },
}
