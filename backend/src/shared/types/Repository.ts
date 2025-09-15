export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface BaseFilters {
  search?: string
  sortBy?: SortOptions[]
  pagination?: PaginationOptions
}

export interface RepositoryQuery<T = any> {
  where?: Record<string, any>
  include?: Record<string, any>
  orderBy?: Record<string, any>[]
  take?: number
  skip?: number
}

export abstract class BaseRepository<T, CreateData, UpdateData, Filters extends BaseFilters = BaseFilters> {
  abstract create(data: CreateData): Promise<T>
  abstract findById(id: string): Promise<T | null>
  abstract findMany(filters?: Filters): Promise<T[]>
  abstract findWithPagination(filters?: Filters): Promise<PaginationResult<T>>
  abstract update(id: string, data: UpdateData): Promise<T>
  abstract delete(id: string): Promise<void>
  abstract exists(id: string): Promise<boolean>
  abstract count(filters?: Filters): Promise<number>
}