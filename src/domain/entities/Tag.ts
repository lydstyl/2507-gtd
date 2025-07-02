import { User } from './User'

export interface Tag {
  id: string
  name: string
  color?: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
  user?: User
}

export interface CreateTagData {
  name: string
  color?: string
  userId: string
}

export interface UpdateTagData {
  name?: string
  color?: string
  userId?: string
}
