import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { RHFInput } from './RHFInput'
import { RHFSelect } from './RHFSelect'
import { RHFCheckbox } from './RHFCheckbox'
import { RHFTextarea } from './RHFTextarea'
import { RHFRadio } from './RHFRadio'

// Define validation schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  priority: z.string().min(1, 'Please select a priority'),
  status: z.string().min(1, 'Please select a status'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms',
  }),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  frequency: z.string().min(1, 'Please select a frequency'),
})

type FormData = z.infer<typeof formSchema>

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

/**
 * Example form demonstrating all RHF (React Hook Form) components with validation
 */
export function FormComponentsExample() {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      priority: 'medium',
      status: 'active',
      agreeToTerms: false,
      description: '',
      frequency: 'weekly',
    },
  })

  const onSubmit = (data: FormData) => {
    console.log('Form Data:', data)
    alert(JSON.stringify(data, null, 2))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Form Components Library
          </h1>
          <p className="text-gray-600 mb-8">
            Comprehensive example showcasing all reusable React Hook Form components
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Text Input */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Basic Information
              </h2>
              <div className="space-y-6">
                <RHFInput
                  control={control}
                  name="name"
                  label="Full Name"
                  placeholder="John Doe"
                  helperText="Enter your full name as it appears on official documents"
                />

                <RHFInput
                  control={control}
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  helperText="We'll never share your email with anyone"
                />
              </div>
            </section>

            {/* Select and Radio */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Priority & Status
              </h2>
              <div className="space-y-6">
                <RHFSelect
                  control={control}
                  name="priority"
                  label="Priority Level"
                  options={priorityOptions}
                  helperText="Select the priority level for this item"
                />

                <RHFSelect
                  control={control}
                  name="status"
                  label="Status"
                  options={statusOptions}
                  helperText="Choose the current status"
                />
              </div>
            </section>

            {/* Radio Button Group */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Preferences
              </h2>
              <RHFRadio
                control={control}
                name="frequency"
                label="Update Frequency"
                options={frequencyOptions}
                helperText="How often would you like to receive updates?"
              />
            </section>

            {/* Textarea */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Additional Details
              </h2>
              <RHFTextarea
                control={control}
                name="description"
                label="Description"
                placeholder="Provide a detailed description..."
                rows={5}
                helperText="Minimum 10 characters required"
              />
            </section>

            {/* Checkbox */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Agreement
              </h2>
              <RHFCheckbox
                control={control}
                name="agreeToTerms"
                label="I agree to the terms and conditions"
                helperText="Please read and accept the terms before submitting"
              />
            </section>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Submit Form
              </button>
              <button
                type="button"
                onClick={() => reset()}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Display validation errors */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  Validation Errors:
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>
                      • {field}: {error?.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>

          {/* Documentation */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Component Documentation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  RHFInput
                </h3>
                <p className="text-gray-600">
                  Text input with support for different types (text, email, password, number). Includes label, help text, and error display.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  RHFSelect
                </h3>
                <p className="text-gray-600">
                  Dropdown select component with ARIA attributes for accessibility. Perfect for single or predefined options.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  RHFCheckbox
                </h3>
                <p className="text-gray-600">
                  Checkbox component for boolean values. Works great for single selections or agreement confirmations.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  RHFRadio
                </h3>
                <p className="text-gray-600">
                  Radio button group for single selection from multiple options. Supports descriptions for each option.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  RHFTextarea
                </h3>
                <p className="text-gray-600">
                  Multi-line text input for longer content. Customizable rows and includes proper error handling.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Features
                </h3>
                <ul className="text-gray-600 space-y-1">
                  <li>✓ Full TypeScript support</li>
                  <li>✓ Tailwind CSS styling</li>
                  <li>✓ ARIA accessibility</li>
                  <li>✓ Validation integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
