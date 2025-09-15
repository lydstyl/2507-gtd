import type {
  Task,
  CreateTaskData,
  UpdateTaskData,
  Tag,
  CreateTagData
} from '../types/task'
import type { User, LoginCredentials, RegisterCredentials } from '../types/auth'

// Detect environment and API base URL
const isProduction = import.meta.env.PROD
const apiPort = import.meta.env.VITE_API_PORT || (isProduction ? undefined : '3000')
const API_BASE_URL = isProduction ? '/api' : `http://localhost:${apiPort}/api`

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  timestamp: string
  statusCode: number
}

interface ApiErrorResponse {
  error: {
    message: string
    status: number
    timestamp: string
    path: string
    context?: Record<string, any>
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
    let errorMessage = 'Request failed'
    try {
      const errorData: ApiErrorResponse = await response.json()
      errorMessage = errorData.error?.message || errorMessage
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }
    throw new ApiError(response.status, errorMessage)
  }

  // Handle empty responses (like DELETE 204)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    const data: ApiResponse<T> = await response.json()
    return data.data || data as T
  }

  return response as unknown as T
}

async function apiCallBlob(
  endpoint: string,
  options: RequestInit = {}
): Promise<Blob> {
  const token = localStorage.getItem('token')

  const headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  // Add any additional headers from options
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers[key] = value as string
    })
  }

  const config: RequestInit = {
    ...options,
    headers
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    let errorMessage = 'Request failed'
    try {
      const errorData: ApiErrorResponse = await response.json()
      errorMessage = errorData.error?.message || errorMessage
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }
    throw new ApiError(response.status, errorMessage)
  }

  return response.blob()
}

// Auth API
export const authApi = {
  register: (credentials: RegisterCredentials) =>
    apiCall<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  login: (credentials: LoginCredentials) =>
    apiCall<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
}

// Tasks API
export const tasksApi = {
  getTasks: () => apiCall<Task[]>('/tasks'),

  getAllTasks: () => apiCall<Task[]>('/tasks?includeSubtasks=true'),

  getRootTasks: () => apiCall<Task[]>('/tasks/root'),

  getTask: (id: string) => apiCall<Task>(`/tasks/${id}`),

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
    )
}

// Tags API
export const tagsApi = {
  getTags: () => apiCall<Tag[]>('/tags'),

  getTag: (id: string) => apiCall<Tag>(`/tags/${id}`),

  createTag: (data: CreateTagData) =>
    apiCall<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateTag: (id: string, data: Partial<CreateTagData>) =>
    apiCall<Tag>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteTag: (id: string) =>
    apiCall<void>(`/tags/${id}`, {
      method: 'DELETE'
    }),
}

// Legacy API object for backward compatibility
export const api = {
  ...authApi,
  ...tasksApi,
  ...tagsApi,
  register: authApi.register,
  login: authApi.login,
}