export interface User {
  id: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
  tasks?: any[] // à typer plus tard
  tags?: any[] // à typer plus tard
}
