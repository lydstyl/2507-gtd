import { PrismaClient } from '@prisma/client'

// Repositories
import { TaskRepository } from '../interfaces/repositories/TaskRepository'
import { TagRepository } from '../interfaces/repositories/TagRepository'
import { UserRepository } from '../interfaces/repositories/UserRepository'
import { PrismaTaskRepository } from './repositories/PrismaTaskRepository'
import { PrismaTagRepository } from './repositories/PrismaTagRepository'
import { PrismaUserRepository } from './repositories/PrismaUserRepository'

// Application Services
import { AuthService } from '../application/services/AuthService'
import { CsvService } from '../application/services/CsvService'
import { HealthService } from '../application/services/HealthService'

// Use Cases - Tasks (using old ones for now)
import { CreateTaskUseCase } from '../usecases/tasks/CreateTaskUseCase'
import { GetTaskUseCase } from '../usecases/tasks/GetTaskUseCase'
import { GetAllTasksUseCase } from '../usecases/tasks/GetAllTasksUseCase'
import { UpdateTaskUseCase } from '../usecases/tasks/UpdateTaskUseCase'
import { DeleteTaskUseCase } from '../usecases/tasks/DeleteTaskUseCase'
import { ExportTasksUseCase } from '../usecases/tasks/ExportTasksUseCase'
import { ImportTasksUseCase } from '../usecases/tasks/ImportTasksUseCase'
import { MarkTaskAsCompletedUseCase } from '../usecases/tasks/MarkTaskAsCompletedUseCase'
import { GetCompletionStatsUseCase } from '../usecases/tasks/GetCompletionStatsUseCase'
import { GetCompletedTasksUseCase } from '../usecases/tasks/GetCompletedTasksUseCase'

// Use Cases - Tags
import { CreateTagUseCase } from '../usecases/tags/CreateTagUseCase'
import { GetAllTagsUseCase } from '../usecases/tags/GetAllTagsUseCase'
import { DeleteTagUseCase } from '../usecases/tags/DeleteTagUseCase'
import { UpdateTagUseCase } from '../usecases/tags/UpdateTagUseCase'

// Controllers
import { TaskController } from '../presentation/controllers/TaskController'
import { TagController } from '../presentation/controllers/TagController'
import { AuthController } from '../presentation/controllers/AuthController'
import { HealthController } from '../presentation/controllers/HealthController'

import { logger } from '../shared/logger'

export class Container {
  private static instance: Container
  private prisma: PrismaClient

  // Repositories
  private _taskRepository?: TaskRepository
  private _tagRepository?: TagRepository
  private _userRepository?: UserRepository

  // Services
  private _authService?: AuthService
  private _healthService?: HealthService

  // Controllers
  private _taskController?: TaskController
  private _tagController?: TagController
  private _authController?: AuthController
  private _healthController?: HealthController

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['warn', 'error']
    })

    logger.info('Container initialized with Prisma client')
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  // Repository getters with lazy loading
  get taskRepository(): TaskRepository {
    if (!this._taskRepository) {
      this._taskRepository = new PrismaTaskRepository(this.prisma)
    }
    return this._taskRepository
  }

  get tagRepository(): TagRepository {
    if (!this._tagRepository) {
      this._tagRepository = new PrismaTagRepository(this.prisma)
    }
    return this._tagRepository
  }

  get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new PrismaUserRepository(this.prisma)
    }
    return this._userRepository
  }

  // Service getters with lazy loading
  get authService(): AuthService {
    if (!this._authService) {
      this._authService = new AuthService(this.userRepository)
    }
    return this._authService
  }

  get healthService(): HealthService {
    if (!this._healthService) {
      this._healthService = new HealthService(this.prisma)
    }
    return this._healthService
  }

  // Controller getters with lazy loading
  getTaskController(): TaskController {
    if (!this._taskController) {
      const createTaskUseCase = new CreateTaskUseCase(this.taskRepository)
      const getTaskUseCase = new GetTaskUseCase(this.taskRepository)
      const getAllTasksUseCase = new GetAllTasksUseCase(this.taskRepository)
      const updateTaskUseCase = new UpdateTaskUseCase(this.taskRepository)
      const deleteTaskUseCase = new DeleteTaskUseCase(this.taskRepository)
      const exportTasksUseCase = new ExportTasksUseCase(this.taskRepository)
      const importTasksUseCase = new ImportTasksUseCase(
        this.taskRepository,
        this.tagRepository
      )
      const markTaskAsCompletedUseCase = new MarkTaskAsCompletedUseCase(this.taskRepository)
      const getCompletionStatsUseCase = new GetCompletionStatsUseCase(this.taskRepository)
      const getCompletedTasksUseCase = new GetCompletedTasksUseCase(this.taskRepository)

      this._taskController = new TaskController(
        createTaskUseCase,
        getTaskUseCase,
        getAllTasksUseCase,
        updateTaskUseCase,
        deleteTaskUseCase,
        exportTasksUseCase,
        importTasksUseCase,
        markTaskAsCompletedUseCase,
        getCompletionStatsUseCase,
        getCompletedTasksUseCase
      )
    }
    return this._taskController
  }

  getTagController(): TagController {
    if (!this._tagController) {
      const createTagUseCase = new CreateTagUseCase(this.tagRepository)
      const getAllTagsUseCase = new GetAllTagsUseCase(this.tagRepository)
      const deleteTagUseCase = new DeleteTagUseCase(this.tagRepository)
      const updateTagUseCase = new UpdateTagUseCase(this.tagRepository)

      this._tagController = new TagController(
        createTagUseCase,
        getAllTagsUseCase,
        deleteTagUseCase,
        updateTagUseCase
      )
    }
    return this._tagController
  }

  getAuthController(): AuthController {
    if (!this._authController) {
      // Use old AuthService for backward compatibility for now
      const { AuthService: OldAuthService } = require('../services/authService')
      const oldAuthService = new OldAuthService(this.userRepository)
      this._authController = new AuthController(oldAuthService)
    }
    return this._authController
  }

  getHealthController(): HealthController {
    if (!this._healthController) {
      this._healthController = new HealthController(this.healthService)
    }
    return this._healthController
  }

  async disconnect(): Promise<void> {
    logger.info('Disconnecting from database')
    await this.prisma.$disconnect()
  }

  async reset(): Promise<void> {
    logger.warn('Resetting container - clearing all cached instances')

    // Clear all cached instances
    this._taskRepository = undefined
    this._tagRepository = undefined
    this._userRepository = undefined
    this._authService = undefined
    this._healthService = undefined
    this._taskController = undefined
    this._tagController = undefined
    this._authController = undefined
    this._healthController = undefined

    // Disconnect and recreate Prisma client
    await this.prisma.$disconnect()
    this.prisma = new PrismaClient({
      log: ['warn', 'error']
    })
  }
}