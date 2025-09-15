import { User, CreateUserData, UpdateUserData } from '../../../domain/entities/User'
import { BaseRepository, PaginationResult, BaseFilters } from '../../../shared/types/Repository'

export interface UserFilters extends BaseFilters {
  email?: string
  createdAfter?: Date
  createdBefore?: Date
}

export interface UserRepository extends BaseRepository<User, CreateUserData, UpdateUserData, UserFilters> {
  // Enhanced query methods
  findMany(filters?: UserFilters): Promise<User[]>
  findWithPagination(filters?: UserFilters): Promise<PaginationResult<User>>

  // Specialized methods
  findByEmail(email: string): Promise<User | null>

  // Utility methods
  existsByEmail(email: string, excludeId?: string): Promise<boolean>
}