import type { Meta, StoryObj } from '@storybook/react'
import { AdvancedDataTable } from './AdvancedDataTable'
import type { Employee } from '../../types/employee'

const meta: Meta<typeof AdvancedDataTable> = {
  title: 'Components/AdvancedDataTable',
  component: AdvancedDataTable,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Advanced data table component built with TanStack Table v8. Features include multi-column sorting, column visibility toggle, row selection with checkboxes, virtual scrolling for performance, and comprehensive filtering.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Generate mock employee data
const generateMockEmployees = (count: number): Employee[] => {
  const firstNames = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Lisa',
    'Robert', 'Mary',
  ]
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez',
  ]
  const departments = [
    'Engineering', 'Sales', 'Marketing', 'HR', 'Finance',
  ]
  const positions = [
    'Manager', 'Senior Developer', 'Junior Developer', 'Product Manager',
    'Designer',
  ]
  const statuses: Array<'active' | 'inactive' | 'on-leave'> = [
    'active', 'active', 'inactive', 'on-leave',
  ]

  const employees: Employee[] = []
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[i % lastNames.length]
    employees.push({
      id: `emp-${i + 1}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      department: departments[i % departments.length],
      position: positions[i % positions.length],
      salary: 50000 + Math.floor(Math.random() * 150000),
      joinDate: new Date(
        2020 + Math.floor(i / 20),
        i % 12,
        (i % 28) + 1
      ).toISOString(),
      status: statuses[i % statuses.length],
      phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
  return employees
}

/**
 * Basic table with 50 employees showing all standard features:
 * - Multi-column sorting by clicking column headers
 * - Row selection with checkboxes
 * - Column visibility controls with Show All/Hide All buttons
 * - Virtual scrolling for performance
 * - Responsive design with proper column alignment
 */
export const Default: Story = {
  args: {
    data: generateMockEmployees(50),
    isLoading: false,
    isError: false,
  },
}

/**
 * Table in loading state - displays spinner and loading message
 */
export const Loading: Story = {
  args: {
    data: [],
    isLoading: true,
    isError: false,
  },
}

/**
 * Table in error state - displays error message instead of data
 */
export const Error: Story = {
  args: {
    data: [],
    isLoading: false,
    isError: true,
    errorMessage: 'Failed to fetch employee data. Please try again later.',
  },
}

/**
 * Empty table state - shows empty message when no employees match filters
 */
export const Empty: Story = {
  args: {
    data: [],
    isLoading: false,
    isError: false,
  },
}

/**
 * Table with large dataset (200+ employees) demonstrating virtual scrolling
 */
export const LargeDataset: Story = {
  args: {
    data: generateMockEmployees(200),
    isLoading: false,
    isError: false,
  },
}

/**
 * Table with custom error message
 */
export const CustomError: Story = {
  args: {
    data: [],
    isLoading: false,
    isError: true,
    errorMessage: 'Network connection failed. Please check your internet connection.',
  },
}
