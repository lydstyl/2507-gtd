import type { UserBase } from './TaskTypes'

/**
 * Generic User Entity that works with both Date objects (backend) and string dates (frontend)
 */
export class UserEntity<TDate extends string | Date = string | Date> {
  private readonly user: UserBase<TDate>

  constructor(user: UserBase<TDate>) {
    this.user = user
  }

  // Getters
  get id(): string {
    return this.user.id
  }

  get email(): string {
    return this.user.email
  }

  get password(): string {
    return this.user.password
  }

  get createdAt(): TDate {
    return this.user.createdAt
  }

  get updatedAt(): TDate {
    return this.user.updatedAt
  }

  get tasks(): UserBase<TDate>['tasks'] {
    return this.user.tasks
  }

  get tags(): UserBase<TDate>['tags'] {
    return this.user.tags
  }

  get rawUser(): UserBase<TDate> {
    return this.user
  }

  /**
   * Check if user has tasks
   */
  hasTasks(): boolean {
    return Boolean(this.user.tasks && this.user.tasks.length > 0)
  }

  /**
   * Check if user has tags
   */
  hasTags(): boolean {
    return Boolean(this.user.tags && this.user.tags.length > 0)
  }

  /**
   * Get task count
   */
  getTaskCount(): number {
    return this.user.tasks?.length || 0
  }

  /**
   * Get tag count
   */
  getTagCount(): number {
    return this.user.tags?.length || 0
  }
}