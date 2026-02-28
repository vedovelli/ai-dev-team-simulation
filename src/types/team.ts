export interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  avatar?: string
  status: 'active' | 'idle' | 'offline'
  joinedAt: string
}
