export type UserRole = 'admin' | 'developer' | 'manager'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}
