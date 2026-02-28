export interface TeamMember {
  id: string
  name: string
  role: string
  status: 'active' | 'idle' | 'offline'
  tasksCompleted: number
  performanceScore: number
  recentActivity: string
}
