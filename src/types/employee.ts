export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string
  position: string
  salary: number
  joinDate: string
  status: 'active' | 'inactive' | 'on-leave'
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface EmployeeFilter {
  search?: string
  department?: string
  status?: string
}

export interface EmployeesResponse {
  data: Employee[]
  total: number
  pageIndex: number
  pageSize: number
}
