import { FieldApi } from '@tanstack/react-form'
import { FormField } from './FormField'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  field: FieldApi<any, any, any, any>
  label?: string
  options: SelectOption[]
  placeholder?: string
  multiple?: boolean
  helpText?: string
}

export function Select({
  field,
  label,
  options,
  placeholder,
  multiple = false,
  helpText,
}: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (multiple) {
      const selected = Array.from(e.target.selectedOptions, (option) => option.value)
      field.handleChange(selected)
    } else {
      field.handleChange(e.target.value)
    }
  }

  const currentValue = multiple ? (Array.isArray(field.state.value) ? field.state.value : []) : field.state.value

  return (
    <FormField field={field} label={label} helpText={helpText}>
      <select
        id={field.name}
        name={field.name}
        value={currentValue}
        onChange={handleChange}
        onBlur={field.handleBlur}
        multiple={multiple}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {!multiple && placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
