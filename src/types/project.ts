export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'archived' | 'completed'
  createdAt: string
  updatedAt: string
}
