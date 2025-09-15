import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../services/api'
import type { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types/auth'

export const AUTH_QUERY_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
} as const

// Utility function to decode JWT token
function decodeToken(token: string): { userId: string; email: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      userId: payload.userId,
      email: payload.email
    }
  } catch {
    return null
  }
}

// Hook to get current user from token
export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: () => {
      const token = localStorage.getItem('token')
      if (!token) return null

      const decoded = decodeToken(token)
      if (!decoded) {
        localStorage.removeItem('token')
        return null
      }

      return {
        id: decoded.userId,
        email: decoded.email
      } as User
    },
    staleTime: Infinity, // User data doesn't change often
  })
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data: AuthResponse) => {
      localStorage.setItem('token', data.token)
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, data.user)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: () => {
      localStorage.removeItem('token')
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, null)
    }
  })
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (user: User) => {
      // Note: Register might not return a token, so we may need to login after
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, user)
    }
  })
}

// Logout function
export function useLogout() {
  const queryClient = useQueryClient()

  return () => {
    localStorage.removeItem('token')
    queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, null)
    queryClient.clear() // Clear all cached data
  }
}

// Hook to check if user is authenticated
export function useIsAuthenticated() {
  const { data: user } = useCurrentUser()
  const token = localStorage.getItem('token')
  return !!(user && token)
}