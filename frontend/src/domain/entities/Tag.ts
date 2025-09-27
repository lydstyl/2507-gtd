// Re-export shared Tag entity and types for frontend compatibility
export { TagEntity } from '@gtd/shared'
export type { TagBase as Tag } from '@gtd/shared'

// Legacy type aliases for backward compatibility
export type CreateTagData = {
   name: string
   color?: string
}

export type UpdateTagData = {
   name?: string
   color?: string
}