# React Hook Form Components Library

A comprehensive set of reusable, accessible form components that integrate seamlessly with React Hook Form. All components support validation, error display, help text, and full TypeScript support.

## Overview

This library provides production-ready form components with the following features:

- **React Hook Form Integration**: Full support for `Controller` and form state management
- **TypeScript Support**: Fully typed with generic support for your form data structures
- **Accessibility**: ARIA attributes and semantic HTML for screen readers
- **Tailwind CSS Styling**: Consistent design tokens and focus states
- **Validation Error Display**: Integrated error messages from React Hook Form
- **Help Text**: Optional helper text for guidance
- **Multiple States**: Support for disabled, readonly, and focus states
- **Flexible Sizes**: Components support different input sizes (small, medium, large)

## Components

### RHFInput

Text input component with support for multiple input types.

**Props:**
- `control` - React Hook Form control instance
- `name` - Field name in your form data
- `label` - Optional label text
- `type` - Input type: 'text' | 'email' | 'password' | 'number'
- `placeholder` - Placeholder text
- `helperText` - Optional helper text below the input
- `disabled` - Disable the input
- `readonly` - Make the input readonly
- All standard HTML input attributes

**Example:**
```tsx
import { useForm } from 'react-hook-form'
import { RHFInput } from './RHFComponents'

export function MyForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: { email: '' }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <RHFInput
        control={control}
        name="email"
        label="Email Address"
        type="email"
        placeholder="user@example.com"
        helperText="We'll never share your email"
      />
    </form>
  )
}
```

### RHFSelect

Dropdown select component with options array.

**Props:**
- `control` - React Hook Form control instance
- `name` - Field name in your form data
- `label` - Optional label text
- `options` - Array of `{ value: string | number; label: string }` objects
- `helperText` - Optional helper text below the select
- `disabled` - Disable the select
- `multiple` - Allow multiple selections
- All standard HTML select attributes

**Example:**
```tsx
<RHFSelect
  control={control}
  name="priority"
  label="Priority Level"
  options={[
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' }
  ]}
  helperText="Select the priority level"
/>
```

### RHFCheckbox

Checkbox component for boolean values.

**Props:**
- `control` - React Hook Form control instance
- `name` - Field name in your form data
- `label` - Optional label text
- `helperText` - Optional helper text below the checkbox
- `disabled` - Disable the checkbox
- All standard HTML input attributes (except 'type' and 'name')

**Example:**
```tsx
<RHFCheckbox
  control={control}
  name="agreeToTerms"
  label="I agree to the terms and conditions"
  helperText="You must agree to continue"
/>
```

### RHFRadio

Radio button group for single selection from multiple options.

**Props:**
- `control` - React Hook Form control instance
- `name` - Field name in your form data
- `label` - Optional label text for the group
- `options` - Array of options with shape:
  ```typescript
  {
    value: string | number
    label: string
    description?: string  // Optional description under the radio label
  }
  ```
- `helperText` - Optional helper text below the group
- `disabled` - Disable all radio buttons
- All standard HTML input attributes (except 'type' and 'name')

**Example:**
```tsx
<RHFRadio
  control={control}
  name="frequency"
  label="Update Frequency"
  options={[
    {
      value: 'daily',
      label: 'Daily',
      description: 'Get updates every day'
    },
    {
      value: 'weekly',
      label: 'Weekly',
      description: 'Get updates once a week'
    }
  ]}
/>
```

### RHFTextarea

Multi-line text input component.

**Props:**
- `control` - React Hook Form control instance
- `name` - Field name in your form data
- `label` - Optional label text
- `placeholder` - Placeholder text
- `rows` - Number of visible rows (default: 4)
- `helperText` - Optional helper text below the textarea
- `disabled` - Disable the textarea
- `readonly` - Make the textarea readonly
- All standard HTML textarea attributes

**Example:**
```tsx
<RHFTextarea
  control={control}
  name="description"
  label="Description"
  placeholder="Enter a detailed description"
  rows={5}
  helperText="Minimum 10 characters required"
/>
```

## Complete Form Example

See `FormComponentsExample.tsx` for a fully functional form demonstrating all components with validation using Zod and React Hook Form.

## Validation Integration

Components work seamlessly with React Hook Form validation:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name too short')
})

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema)
})

// Errors are automatically displayed in components
```

## Styling

All components use Tailwind CSS with the following design tokens:

- **Border Color**: `border-gray-300` (default) / `border-red-500` (error)
- **Focus Ring**: `focus:ring-2 focus:ring-blue-500`
- **Error Text**: `text-red-600`
- **Label**: `text-sm font-medium text-gray-700`
- **Helper Text**: `text-gray-500`

Customize styling by modifying the className strings in each component.

## Accessibility Features

- Semantic HTML (`<label>`, `<fieldset>`, etc.)
- ARIA attributes for error states
- Proper focus management
- Labels associated with form fields via `htmlFor`
- Error messages announced to screen readers

## TypeScript Support

All components are fully typed with generic support:

```tsx
interface FormData {
  email: string
  priority: 'low' | 'medium' | 'high'
}

const { control } = useForm<FormData>({
  defaultValues: { email: '', priority: 'medium' }
})

// Type-safe!
<RHFInput control={control} name="email" />
<RHFSelect control={control} name="priority" options={...} />
```

## Storybook Stories

Each component has comprehensive Storybook stories demonstrating:
- Default state
- With helper text
- Disabled state
- Different input types/options
- Multiple instances
- Required fields

View stories:
```bash
npm run storybook
```

## Migration Guide

If migrating from other form libraries:

1. Replace the old component import with RHF component
2. Pass `control` from `useForm()` instead of field props
3. Use `name` instead of `field` or `bind`
4. Validation errors are automatically displayed

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance

Components use React Hook Form's efficient `Controller` for optimal re-render performance. No unnecessary re-renders of sibling fields.

## Common Patterns

### Field Groups

```tsx
<fieldset>
  <legend>Notification Preferences</legend>
  <RHFCheckbox control={control} name="email" label="Email" />
  <RHFCheckbox control={control} name="sms" label="SMS" />
</fieldset>
```

### Conditional Fields

```tsx
{watch('type') === 'custom' && (
  <RHFInput control={control} name="customValue" />
)}
```

### Dynamic Options

```tsx
const options = useMemo(() => getOptionsForType(type), [type])
<RHFSelect control={control} name="field" options={options} />
```

## Troubleshooting

**Error not showing?**
- Ensure you're using `zodResolver` or equivalent validator
- Check that `handleSubmit` is called on form submit

**Component not updating?**
- Ensure `control` object is from the same `useForm()` instance
- Check React Hook Form version compatibility

**Styling issues?**
- Verify Tailwind CSS is properly configured
- Check for CSS conflicts with global styles

## API Reference

All components accept the same base props plus component-specific props:

```typescript
interface BaseProps {
  control: Control<FieldValues>
  name: FieldPath<FieldValues>
  label?: string
  helperText?: string
  disabled?: boolean
}
```

## License

These components are part of the AI Dev Team Simulation project.
