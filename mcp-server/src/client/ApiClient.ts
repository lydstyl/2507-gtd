import {
  TaskDto,
  TagDto,
  CreateTaskDto,
  UpdateTaskDto,
  CreateTagDto,
  UpdateTagDto,
  TaskQueryParams,
} from './types.js'

export class ApiClient {
  private baseUrl: string
  private token: string

  constructor(token: string, baseUrl?: string) {
    this.token = token
    this.baseUrl = (baseUrl ?? process.env['GTD_API_URL'] ?? 'http://localhost:3000').replace(/\/$/, '')
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`

    if (query) {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) params.set(k, String(v))
      }
      const qs = params.toString()
      if (qs) url += `?${qs}`
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      let message = `HTTP ${res.status}`
      try {
        const data = (await res.json()) as { error?: string }
        if (data.error) message = data.error
      } catch {}
      if (res.status === 401) throw new Error('Authentication failed — check your API token')
      if (res.status === 404) throw new Error('Resource not found')
      throw new Error(message)
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────

  async listTasks(filters?: TaskQueryParams): Promise<TaskDto[]> {
    return this.request<TaskDto[]>('GET', '/api/tasks', undefined, filters as Record<string, string | number | boolean | undefined>)
  }

  async getTask(id: string): Promise<TaskDto> {
    return this.request<TaskDto>('GET', `/api/tasks/${id}`)
  }

  async createTask(data: CreateTaskDto): Promise<TaskDto> {
    return this.request<TaskDto>('POST', '/api/tasks', data)
  }

  async updateTask(id: string, data: UpdateTaskDto): Promise<TaskDto> {
    return this.request<TaskDto>('PUT', `/api/tasks/${id}`, data)
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>('DELETE', `/api/tasks/${id}`)
  }

  async completeTask(id: string): Promise<TaskDto> {
    return this.request<TaskDto>('POST', `/api/tasks/${id}/complete`)
  }

  // ── Tags ───────────────────────────────────────────────────────────────────

  async listTags(): Promise<TagDto[]> {
    return this.request<TagDto[]>('GET', '/api/tags')
  }

  async createTag(data: CreateTagDto): Promise<TagDto> {
    return this.request<TagDto>('POST', '/api/tags', data)
  }

  async updateTag(id: string, data: UpdateTagDto): Promise<TagDto> {
    return this.request<TagDto>('PUT', `/api/tags/${id}`, data)
  }

  async deleteTag(id: string): Promise<void> {
    return this.request<void>('DELETE', `/api/tags/${id}`)
  }

  // ── Resolution helpers ─────────────────────────────────────────────────────

  async resolveTaskId(taskId?: string, taskName?: string): Promise<string> {
    if (taskId) return taskId

    if (!taskName) throw new Error('Either taskId or taskName must be provided')

    const tasks = await this.listTasks({ search: taskName })
    const lower = taskName.toLowerCase()
    const matches = tasks.filter((t) => t.name.toLowerCase().includes(lower))

    if (matches.length === 0) throw new Error(`No task found matching "${taskName}"`)
    if (matches.length === 1) return matches[0].id

    const list = matches.map((t) => `- "${t.name}" (id: ${t.id})`).join('\n')
    throw new Error(
      `Multiple tasks match "${taskName}". Please be more specific or use taskId:\n${list}`
    )
  }

  async resolveTagId(tagId?: string, tagName?: string): Promise<string> {
    if (tagId) return tagId

    if (!tagName) throw new Error('Either tagId or tagName must be provided')

    const tags = await this.listTags()
    const lower = tagName.toLowerCase()
    const matches = tags.filter((t) => t.name.toLowerCase() === lower)

    if (matches.length === 0) {
      const partial = tags.filter((t) => t.name.toLowerCase().includes(lower))
      if (partial.length === 1) return partial[0].id
      if (partial.length > 1) {
        const list = partial.map((t) => `- "${t.name}" (id: ${t.id})`).join('\n')
        throw new Error(
          `Multiple tags match "${tagName}". Please be more specific or use tagId:\n${list}`
        )
      }
      throw new Error(`No tag found matching "${tagName}"`)
    }
    return matches[0].id
  }

  async resolveTagIds(tagNames?: string[], tagIds?: string[]): Promise<string[]> {
    const ids: string[] = [...(tagIds ?? [])]
    if (!tagNames || tagNames.length === 0) return ids

    for (const name of tagNames) {
      const id = await this.resolveTagId(undefined, name)
      if (!ids.includes(id)) ids.push(id)
    }
    return ids
  }
}
