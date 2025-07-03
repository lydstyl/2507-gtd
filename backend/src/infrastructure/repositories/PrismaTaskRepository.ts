import { PrismaClient } from '@prisma/client'
import { TaskRepository, TaskFilters } from '../../interfaces/repositories/TaskRepository'
import {
  Task,
  TaskWithSubtasks,
  CreateTaskData,
  UpdateTaskData
} from '../../domain/entities/Task'

export class PrismaTaskRepository implements TaskRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTaskData): Promise<TaskWithSubtasks> {
    const { tagIds, ...taskData } = data

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        importance: taskData.importance || 5,
        urgency: taskData.urgency || 5,
        priority: taskData.priority || 5,
        dueDate: taskData.dueDate ?? undefined,
        userId: taskData.userId,
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({
                tag: {
                  connect: { id: tagId }
                }
              }))
            }
          : undefined
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        subtasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      }
    })

    return this.formatTaskWithSubtasks(task)
  }

  async findById(id: string): Promise<TaskWithSubtasks | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        subtasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      }
    })

    return task ? this.formatTaskWithSubtasks(task) : null
  }

  async findAll(filters?: TaskFilters): Promise<TaskWithSubtasks[]> {
    const where: any = {}

    if (filters?.parentId) {
      where.parentId = filters.parentId
    } else if (filters?.parentId === null) {
      where.parentId = null
    }

    if (filters?.importance) {
      where.importance = filters.importance
    }

    if (filters?.urgency) {
      where.urgency = filters.urgency
    }

    if (filters?.priority) {
      where.priority = filters.priority
    }

    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive'
      }
    }

    if (filters?.tagIds && filters.tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: filters.tagIds
          }
        }
      }
    }

    if (filters?.userId) {
      where.userId = filters.userId
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        subtasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { importance: 'asc' },
        { urgency: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return tasks.map((task) => this.formatTaskWithSubtasks(task))
  }

  async update(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks> {
    const { tagIds, ...taskData } = data

    const task = await this.prisma.$transaction(async (tx: any) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...taskData,
          dueDate: taskData.dueDate ?? undefined,
          userId: taskData.userId
        },
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          subtasks: {
            include: {
              tags: {
                include: {
                  tag: true
                }
              }
            }
          }
        }
      })

      if (tagIds !== undefined) {
        await tx.taskTag.deleteMany({
          where: { taskId: id }
        })

        if (tagIds.length > 0) {
          await tx.taskTag.createMany({
            data: tagIds.map((tagId) => ({
              taskId: id,
              tagId
            }))
          })
        }

        return await tx.task.findUnique({
          where: { id },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            subtasks: {
              include: {
                tags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          }
        })
      }

      return updatedTask
    })

    return this.formatTaskWithSubtasks(task!)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id }
    })
  }

  async exists(id: string): Promise<boolean> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true }
    })
    return !!task
  }

  private formatTaskWithSubtasks(task: any): TaskWithSubtasks {
    return {
      id: task.id,
      name: task.name,
      link: task.link,
      importance: task.importance,
      urgency: task.urgency,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      parentId: task.parentId,
      userId: task.userId,
      subtasks: task.subtasks.map((subtask: any) =>
        this.formatTaskWithSubtasks(subtask)
      ),
      tags: task.tags.map((taskTag: any) => taskTag.tag)
    }
  }
}
