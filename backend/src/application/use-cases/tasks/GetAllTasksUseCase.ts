import { TaskRepository } from '../../../interfaces/repositories/TaskRepository'
import { TaskWithSubtasks, TaskFilters } from '../../../domain/entities/Task'
import { ValidationError } from '../../../shared/errors'
import { logger } from '../../../shared/logger'

export class GetAllTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string, filters?: Partial<TaskFilters>): Promise<TaskWithSubtasks[]> {
    logger.debug('Retrieving all tasks', { userId, filters })

    try {
      // Ensure userId is always set for security
      const taskFilters: TaskFilters = {
        ...filters,
        userId
      }

      // Validate filters
      this.validateFilters(taskFilters)

      const tasks = await this.taskRepository.findAll(taskFilters)

      logger.debug('Tasks retrieved successfully', {
        userId,
        taskCount: tasks.length,
        filters
      })

      return tasks
    } catch (error) {
      logger.error('Failed to retrieve tasks', {
        userId,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined)

      throw error
    }
  }

  async executeRootTasks(userId: string, filters?: Partial<TaskFilters>): Promise<TaskWithSubtasks[]> {
    logger.debug('Retrieving root tasks', { userId, filters })

    try {
      // Ensure userId is always set for security
      const taskFilters: TaskFilters = {
        ...filters,
        userId
      }

      // Validate filters
      this.validateFilters(taskFilters)

      const tasks = await this.taskRepository.findAllRootTasks(taskFilters)

      logger.debug('Root tasks retrieved successfully', {
        userId,
        taskCount: tasks.length,
        filters
      })

      return tasks
    } catch (error) {
      logger.error('Failed to retrieve root tasks', {
        userId,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined)

      throw error
    }
  }

  private validateFilters(filters: TaskFilters): void {
    if (filters.importance !== undefined && (filters.importance < 0 || filters.importance > 50)) {
      throw new ValidationError('Importance filter must be between 0 and 50')
    }

    if (filters.complexity !== undefined && (filters.complexity < 1 || filters.complexity > 9)) {
      throw new ValidationError('Complexity filter must be between 1 and 9')
    }

    if (filters.points !== undefined && (filters.points < 0 || filters.points > 500)) {
      throw new ValidationError('Points filter must be between 0 and 500')
    }

    if (filters.search !== undefined && filters.search.length > 255) {
      throw new ValidationError('Search term must be 255 characters or less')
    }
  }
}