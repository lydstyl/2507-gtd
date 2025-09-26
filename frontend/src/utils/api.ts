import type {
  Task,
  CreateTaskData,
  UpdateTaskData,
  Tag,
  CreateTagData,
  CompletionStats
} from '../types/task'

// Détecter automatiquement l'environnement et l'URL de base
const isProduction = import.meta.env.PROD
const apiPort =
  import.meta.env.VITE_API_PORT || (isProduction ? undefined : '3000')
const API_BASE_URL = isProduction ? '/api' : `http://localhost:${apiPort}/api`

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }))

    // Handle expired/invalid token
    if (response.status === 401 && (
      errorData.error === 'Invalid or expired token' ||
      errorData.error === 'Token required'
    )) {
      // Clear token and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
      throw new ApiError(response.status, 'Session expired')
    }

    throw new ApiError(response.status, errorData.error || 'Request failed')
  }

  // Pour les réponses vides (comme DELETE 204), ne pas essayer de parser du JSON
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

async function apiCallBlob(
  endpoint: string,
  options: RequestInit = {}
): Promise<Blob> {
  const token = localStorage.getItem('token')

  console.log('🔍 Debug token dans apiCallBlob:')
  console.log('- Token présent:', !!token)
  console.log(
    '- Token valeur:',
    token ? token.substring(0, 20) + '...' : 'null'
  )

  // Créer les headers manuellement pour éviter les problèmes de fusion
  const headers: Record<string, string> = {}

  console.log('🔍 Debug headers:')
  console.log('- options.headers:', options.headers)

  // Ajouter les headers des options
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers[key] = value as string
      console.log(`- Ajouté header: ${key} = ${value}`)
    })
  }

  // Ajouter le token d'authentification
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    console.log(`- Ajouté Authorization: Bearer ${token.substring(0, 20)}...`)
  } else {
    console.log('- Pas de token, Authorization non ajouté')
  }

  console.log('- Headers finaux:', headers)

  const config: RequestInit = {
    ...options,
    headers
  }

  console.log('🔑 Headers envoyés pour export:', config.headers)

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }))

    // Handle expired/invalid token
    if (response.status === 401 && (
      errorData.error === 'Invalid or expired token' ||
      errorData.error === 'Token required'
    )) {
      // Clear token and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
      throw new ApiError(response.status, 'Session expired')
    }

    throw new ApiError(response.status, errorData.error || 'Request failed')
  }

  return response.blob()
}

export const api = {
  // Auth
  register: (data: { email: string; password: string }) =>
    apiCall<{ id: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (data: { email: string; password: string }) =>
    apiCall<{ token: string; user: { id: string; email: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    ),

  // Tasks
  getTasks: () => apiCall<Task[]>('/tasks'),

  getAllTasks: () => apiCall<Task[]>('/tasks?includeSubtasks=true'),

  getRootTasks: () => apiCall<Task[]>('/tasks/root'),

  createTask: (data: CreateTaskData) =>
    apiCall<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateTask: (id: string, data: UpdateTaskData) =>
    apiCall<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  updateTaskNote: (id: string, note: string) =>
    apiCall<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ note })
    }),

  deleteTaskNote: (id: string) =>
    apiCall<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ note: null })
    }),

  deleteTask: (id: string) =>
    apiCall<void>(`/tasks/${id}`, {
      method: 'DELETE'
    }),

  deleteAllTasks: () =>
    apiCall<void>('/tasks/all', {
      method: 'DELETE'
    }),

  markTaskCompleted: (id: string) =>
    apiCall<Task>(`/tasks/${id}/complete`, {
      method: 'POST'
    }),

  getCompletionStats: () =>
    apiCall<CompletionStats>('/tasks/completed/stats'),

  getCompletedTasks: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiCall<Task[]>(`/tasks/completed${query}`)
  },

  // Tags
  getTags: () => apiCall<Tag[]>('/tags'),

  createTag: (data: CreateTagData) =>
    apiCall<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateTag: (id: string, data: { name: string; color: string }) =>
    apiCall<Tag>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteTag: (id: string) =>
    apiCall<void>(`/tags/${id}`, {
      method: 'DELETE'
    }),

  updateTagPositions: (tagPositions: { id: string; position: number }[]) =>
    apiCall<{ message: string }>('/tags/positions', {
      method: 'PUT',
      body: JSON.stringify({ tagPositions })
    }),

  // CSV Export/Import
  exportTasks: () =>
    apiCallBlob('/tasks/export', {
      headers: {
        Accept: 'text/csv'
      }
    }),

  importTasks: (csvContent: string) =>
    apiCall<{ message: string; importedCount: number; errors: string[] }>(
      '/tasks/import',
      {
        method: 'POST',
        body: JSON.stringify({ csvContent })
      }
    ),

  workedOnTask: (id: string) =>
    apiCall<Task>(`/tasks/${id}/worked-on`, {
      method: 'POST'
    })
}
