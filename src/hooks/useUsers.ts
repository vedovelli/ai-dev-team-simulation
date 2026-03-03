import { useQuery } from '@tanstack/react-query'
import type { User } from '../types/user'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users')
      return response.json() as Promise<User[]>
    },
  })
}
