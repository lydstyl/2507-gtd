// Re-export shared Tag entity and types for backend compatibility
export { TagEntity } from '@gtd/shared'
export type { BackendTag as Tag, BackendUser as User } from '@gtd/shared'

// Import for extending
import type { BackendTag } from '@gtd/shared'

// Extended backend Tag interface with position field
export interface BackendTagWithPosition extends BackendTag {
   position: number
}

export interface CreateTagData {
   name: string
   color?: string
   position?: number
   userId: string
}

export interface UpdateTagData {
   name?: string
   color?: string
   position?: number
   userId?: string
}
