// Re-export shared User entity and types for backend compatibility
export { UserEntity } from '@gtd/shared'
export type { BackendUser as User } from '@gtd/shared'

export interface CreateUserData {
   email: string
   password: string
}

export interface UpdateUserData {
   email?: string
   password?: string
}
