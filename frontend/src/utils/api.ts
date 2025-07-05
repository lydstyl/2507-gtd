import type {
  Task,
  CreateTaskData,
  UpdateTaskData,
  Tag,
  CreateTagData
} from '../types/task'

const API_BASE_URL = 'http://localhost:3000/api'

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
    throw new ApiError(response.status, errorData.error || 'Request failed')
  }

  // Pour les réponses vides (comme DELETE 204), ne pas essayer de parser du JSON
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
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

  deleteTask: (id: string) =>
    apiCall<void>(`/tasks/${id}`, {
      method: 'DELETE'
    }),

  // Tags
  getTags: () => apiCall<Tag[]>('/tags'),

  createTag: (data: CreateTagData) =>
    apiCall<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteTag: (id: string) =>
    apiCall<void>(`/tags/${id}`, {
      method: 'DELETE'
    })
}
