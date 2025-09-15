export interface User {
  id: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
  tasks?: any[]
  tags?: any[]
}

export interface CreateUserData {
  email: string
  password: string
}

export interface UpdateUserData {
  email?: string
  password?: string
}
