export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

export interface TeamMembersResponse {
  members: TeamMember[]
}
