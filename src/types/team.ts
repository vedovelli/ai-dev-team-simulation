export interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  createdAt: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  joinedAt: string
}

export interface CreateTeamInput {
  name: string
  description: string
}

export interface UpdateTeamInput {
  name?: string
  description?: string
}
