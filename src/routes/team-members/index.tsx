/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { TeamMembersList } from '../../components/TeamMembers/TeamMembersList'

export const Route = createFileRoute('/team-members/')({
  component: () => <TeamMembersList />,
})
