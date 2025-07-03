import { PrismaClient } from '@prisma/client'
import { TaskRepository } from '../interfaces/repositories/TaskRepository'
import { TagRepository } from '../interfaces/repositories/TagRepository'
import { PrismaTaskRepository } from './repositories/PrismaTaskRepository'
import { PrismaTagRepository } from './repositories/PrismaTagRepository'
import { CreateTaskUseCase } from '../usecases/tasks/CreateTaskUseCase'
import { GetTaskUseCase } from '../usecases/tasks/GetTaskUseCase'
import { GetAllTasksUseCase } from '../usecases/tasks/GetAllTasksUseCase'
import { UpdateTaskUseCase } from '../usecases/tasks/UpdateTaskUseCase'
import { DeleteTaskUseCase } from '../usecases/tasks/DeleteTaskUseCase'
import { CreateTagUseCase } from '../usecases/tags/CreateTagUseCase'
import { GetAllTagsUseCase } from '../usecases/tags/GetAllTagsUseCase'
import { TaskController } from '../presentation/controllers/TaskController'
import { TagController } from '../presentation/controllers/TagController'

export class Container {
  private static instance: Container
  private prisma: PrismaClient
  private taskRepository: TaskRepository
  private tagRepository: TagRepository

  private constructor() {
    this.prisma = new PrismaClient()
    this.taskRepository = new PrismaTaskRepository(this.prisma)
    this.tagRepository = new PrismaTagRepository(this.prisma)
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  getTaskController(): TaskController {
    const createTaskUseCase = new CreateTaskUseCase(this.taskRepository)
    const getTaskUseCase = new GetTaskUseCase(this.taskRepository)
    const getAllTasksUseCase = new GetAllTasksUseCase(this.taskRepository)
    const updateTaskUseCase = new UpdateTaskUseCase(this.taskRepository)
    const deleteTaskUseCase = new DeleteTaskUseCase(this.taskRepository)

    return new TaskController(
      createTaskUseCase,
      getTaskUseCase,
      getAllTasksUseCase,
      updateTaskUseCase,
      deleteTaskUseCase
    )
  }

  getTagController(): TagController {
    const createTagUseCase = new CreateTagUseCase(this.tagRepository)
    const getAllTagsUseCase = new GetAllTagsUseCase(this.tagRepository)

    return new TagController(createTagUseCase, getAllTagsUseCase)
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}
