// Re-export shared Tag entity and types for backend compatibility
export { TagEntity } from '@gtd/shared'
export type { BackendTag as Tag, BackendUser as User } from '@gtd/shared'

// Re-export shared tag data types
export type {
  BackendTagWithPosition,
  CreateTagData,
  UpdateTagData
} from '@gtd/shared'
