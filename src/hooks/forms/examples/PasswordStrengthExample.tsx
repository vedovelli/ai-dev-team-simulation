import { useState } from 'react'
import { useFormValidation } from '../useFormValidation'
import { FormError } from '@/components/Form'

/**
 * Password strength validation example demonstrating:
 * - Multiple sync validation rules
 * - Password strength indicator
 * - Real-time validation feedback
 * - Visual strength representation
 */
export function PasswordStrengthExample() {
  const [password, setPassword] = useState('')
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak')

  const { validateField, getFieldErrors } = useFormValidation({
    validators: {
      password: {
        sync: [
          (value) => (!value ? 'Password is required' : true),
          (value) => (value.length < 8 ? 'Minimum 8 characters required' : true),
          (value) =>
            !/[A-Z]/.test(value) ? 'Must contain at least one uppercase letter' : true,
          (value) =>
            !/[a-z]/.test(value) ? 'Must contain at least one lowercase letter' : true,
          (value) => (!/\d/.test(value) ? 'Must contain at least one number' : true),
        ],
        async: [
          async (value) => {
            if (!value) return true
            // Simulate password strength check
            const response = await fetch('/api/validate/password', {
              method: 'POST',
              body: JSON.stringify({ password: value }),
            })
            const { strength: passwordStrength } = await response.json()
            setStrength(passwordStrength)
            return passwordStrength !== 'weak' ? true : 'Password is too weak'
          },
        ],
        debounce: 300,
      },
    },
  })

  const handlePasswordChange = async (value: string) => {
    setPassword(value)
    if (value) {
      await validateField('password', value)
    }
  }

  const errors = getFieldErrors('password')
  const strengthColor =
    strength === 'strong' ? 'bg-green-500' : strength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
  const strengthText =
    strength === 'strong' ? 'Strong' : strength === 'medium' ? 'Medium' : 'Weak'

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Password Strength Example</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Enter password"
            className={`mt-1 block w-full rounded-md border px-3 py-2 ${
              errors.length > 0
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
        </div>

        {password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Strength</span>
              <span className={`text-sm font-semibold ${strengthColor.replace('bg-', 'text-')}`}>
                {strengthText}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all ${strengthColor}`}
                style={{
                  width: strength === 'strong' ? '100%' : strength === 'medium' ? '66%' : '33%',
                }}
              />
            </div>

            <ul className="space-y-1 text-sm text-gray-600">
              <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                {/[A-Z]/.test(password) ? '✓' : '○'} Uppercase letter
              </li>
              <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                {/[a-z]/.test(password) ? '✓' : '○'} Lowercase letter
              </li>
              <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                {/\d/.test(password) ? '✓' : '○'} Number
              </li>
              <li className={password.length >= 8 ? 'text-green-600' : ''}>
                {password.length >= 8 ? '✓' : '○'} At least 8 characters
              </li>
            </ul>
          </div>
        )}

        {errors.length > 0 && (
          <FormError errors={errors} variant="summary" showIcon />
        )}
      </div>

      <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
        <p>
          <strong>Requirements:</strong> Your password needs uppercase letters, lowercase
          letters, numbers, and at least 8 characters.
        </p>
      </div>
    </div>
  )
}
