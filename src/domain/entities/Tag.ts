export interface Tag {
  id: string
  name: string
  color?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateTagData {
  name: string
  color?: string
}

export interface UpdateTagData {
  name?: string
  color?: string
}
