// Dependency Injection Container for Clean Architecture
import { TaskRepository, TagRepository, UserRepository } from '../interfaces/repositories'
import { HttpTaskRepository, HttpTagRepository, HttpUserRepository } from './repositories'
import { LoggerService } from '@gtd/shared'
import { ConsoleLogger } from './logging/ConsoleLogger'

// Use Cases
import {
  GetTasksUseCase,
  GetTaskByIdUseCase,
  CreateTaskUseCase,
  UpdateTaskUseCase,
  DeleteTaskUseCase,
  DeleteAllTasksUseCase,
  WorkedOnTaskUseCase
} from '../usecases/tasks'

import {
  GetTagsUseCase,
  CreateTagUseCase,
  UpdateTagUseCase,
  DeleteTagUseCase,
  GetTagByIdUseCase
} from '../usecases/tags'

// Container interface
export interface Container {
  // Repositories
  taskRepository: TaskRepository
  tagRepository: TagRepository
  userRepository: UserRepository

  // Services
  logger: LoggerService

  // Task Use Cases
  getTasksUseCase: GetTasksUseCase
  getTaskByIdUseCase: GetTaskByIdUseCase
  createTaskUseCase: CreateTaskUseCase
  updateTaskUseCase: UpdateTaskUseCase
  deleteTaskUseCase: DeleteTaskUseCase
  deleteAllTasksUseCase: DeleteAllTasksUseCase
  workedOnTaskUseCase: WorkedOnTaskUseCase

  // Tag Use Cases
  getTagsUseCase: GetTagsUseCase
  getTagByIdUseCase: GetTagByIdUseCase
  createTagUseCase: CreateTagUseCase
  updateTagUseCase: UpdateTagUseCase
  deleteTagUseCase: DeleteTagUseCase
}

// Singleton container instance
class DIContainer implements Container {
  private static instance: DIContainer

  // Repositories
  public readonly taskRepository: TaskRepository
  public readonly tagRepository: TagRepository
  public readonly userRepository: UserRepository

  // Services
  public readonly logger: LoggerService

  // Task Use Cases
  public readonly getTasksUseCase: GetTasksUseCase
  public readonly getTaskByIdUseCase: GetTaskByIdUseCase
  public readonly createTaskUseCase: CreateTaskUseCase
  public readonly updateTaskUseCase: UpdateTaskUseCase
  public readonly deleteTaskUseCase: DeleteTaskUseCase
  public readonly deleteAllTasksUseCase: DeleteAllTasksUseCase
  public readonly workedOnTaskUseCase: WorkedOnTaskUseCase

  // Tag Use Cases
  public readonly getTagsUseCase: GetTagsUseCase
  public readonly getTagByIdUseCase: GetTagByIdUseCase
  public readonly createTagUseCase: CreateTagUseCase
  public readonly updateTagUseCase: UpdateTagUseCase
  public readonly deleteTagUseCase: DeleteTagUseCase

  private constructor() {
    // Initialize services
    this.logger = new LoggerService(new ConsoleLogger())

    // Initialize repositories
    this.taskRepository = new HttpTaskRepository()
    this.tagRepository = new HttpTagRepository()
    this.userRepository = new HttpUserRepository()

    // Initialize task use cases
    this.getTasksUseCase = new GetTasksUseCase(this.taskRepository)
    this.getTaskByIdUseCase = new GetTaskByIdUseCase(this.taskRepository)
    this.createTaskUseCase = new CreateTaskUseCase(this.taskRepository)
    this.updateTaskUseCase = new UpdateTaskUseCase(this.taskRepository)
    this.deleteTaskUseCase = new DeleteTaskUseCase(this.taskRepository)
    this.deleteAllTasksUseCase = new DeleteAllTasksUseCase(this.taskRepository)
    this.workedOnTaskUseCase = new WorkedOnTaskUseCase(this.taskRepository)

    // Initialize tag use cases
    this.getTagsUseCase = new GetTagsUseCase(this.tagRepository)
    this.getTagByIdUseCase = new GetTagByIdUseCase(this.tagRepository)
    this.createTagUseCase = new CreateTagUseCase(this.tagRepository)
    this.updateTagUseCase = new UpdateTagUseCase(this.tagRepository)
    this.deleteTagUseCase = new DeleteTagUseCase(this.tagRepository, this.taskRepository)
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer()
    }
    return DIContainer.instance
  }

  // Method to reset the container (useful for testing)
  public static reset(): void {
    DIContainer.instance = undefined as any
  }
}

// Export singleton instance
export const container = DIContainer.getInstance()

// Export factory function for creating new containers (useful for testing)
export function createContainer(): Container {
  return new DIContainer()
}

// Utility hooks for React components (these will replace direct API calls)
export function useContainer(): Container {
  return container
}

// Specific use case hooks for convenience
export function useTaskUseCases() {
  return {
    getTasks: container.getTasksUseCase,
    getTaskById: container.getTaskByIdUseCase,
    createTask: container.createTaskUseCase,
    updateTask: container.updateTaskUseCase,
    deleteTask: container.deleteTaskUseCase,
    deleteAllTasks: container.deleteAllTasksUseCase,
    workedOnTask: container.workedOnTaskUseCase
  }
}

export function useTagUseCases() {
  return {
    getTags: container.getTagsUseCase,
    getTagById: container.getTagByIdUseCase,
    createTag: container.createTagUseCase,
    updateTag: container.updateTagUseCase,
    deleteTag: container.deleteTagUseCase
  }
}

export function useRepositories() {
  return {
    tasks: container.taskRepository,
    tags: container.tagRepository,
    users: container.userRepository
  }
}

// Type-safe dependency injection helpers
export type UseCaseType = keyof Pick<Container,
  | 'getTasksUseCase'
  | 'getTaskByIdUseCase'
  | 'createTaskUseCase'
  | 'updateTaskUseCase'
  | 'deleteTaskUseCase'
  | 'deleteAllTasksUseCase'
  | 'getTagsUseCase'
  | 'getTagByIdUseCase'
  | 'createTagUseCase'
  | 'updateTagUseCase'
  | 'deleteTagUseCase'
>

export function getUseCase<T extends UseCaseType>(useCaseType: T): Container[T] {
  return container[useCaseType]
}

// Configuration interface for container setup
export interface ContainerConfig {
  // Future: Could include API base URLs, feature flags, etc.
  apiBaseUrl?: string
  enableCaching?: boolean
  cacheTimeout?: number
}

// Future: Method to configure the container
export function configureContainer(config: ContainerConfig): void {
  // Implementation would modify container behavior based on config
  console.log('Container configuration:', config)
}