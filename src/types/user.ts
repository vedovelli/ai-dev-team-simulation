export type UserRole = 'admin' | 'developer' | 'manager'
export type UserStatus = 'active' | 'inactive' | 'pending'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status?: UserStatus
  createdAt: string
  updatedAt?: string
}
