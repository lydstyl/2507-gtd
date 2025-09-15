export interface UserDto {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface RegisterDto {
  email: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponseDto {
  user: UserDto
  token: string
}