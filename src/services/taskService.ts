import { PrismaClient } from '@prisma/client'
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskWithSubtasks,
  TaskFilters
} from '../types'

const prisma = new PrismaClient()

export class TaskService {
  async createTask(data: CreateTaskRequest): Promise<TaskWithSubtasks> {
    const { tagIds, ...taskData } = data

    // Validate importance, urgency, and priority ranges
    if (
      taskData.importance &&
      (taskData.importance < 1 || taskData.importance > 9)
    ) {
      throw new Error('Importance must be between 1 and 9')
    }
    if (taskData.urgency && (taskData.urgency < 1 || taskData.urgency > 9)) {
      throw new Error('Urgency must be between 1 and 9')
    }
    if (taskData.priority && (taskData.priority < 1 || taskData.priority > 9)) {
      throw new Error('Priority must be between 1 and 9')
    }

    // Check if parent task exists if parentId is provided
    if (taskData.parentId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: taskData.parentId }
      })
      if (!parentTask) {
        throw new Error('Parent task not found')
      }
    }

    const task = await prisma.task.create({
      data: {
        ...taskData,
        importance: taskData.importance || 5,
        urgency: taskData.urgency || 5,
        priority: taskData.priority || 5,
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

  async getTaskById(id: string): Promise<TaskWithSubtasks | null> {
    const task = await prisma.task.findUnique({
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

  async getAllTasks(filters?: TaskFilters): Promise<TaskWithSubtasks[]> {
    const where: any = {}

    if (filters?.parentId) {
      where.parentId = filters.parentId
    } else if (filters?.parentId === null) {
      where.parentId = null // Only root tasks
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

    const tasks = await prisma.task.findMany({
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

  async updateTask(
    id: string,
    data: UpdateTaskRequest
  ): Promise<TaskWithSubtasks> {
    const { tagIds, ...taskData } = data

    // Validate ranges
    if (
      taskData.importance &&
      (taskData.importance < 1 || taskData.importance > 9)
    ) {
      throw new Error('Importance must be between 1 and 9')
    }
    if (taskData.urgency && (taskData.urgency < 1 || taskData.urgency > 9)) {
      throw new Error('Urgency must be between 1 and 9')
    }
    if (taskData.priority && (taskData.priority < 1 || taskData.priority > 9)) {
      throw new Error('Priority must be between 1 and 9')
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })
    if (!existingTask) {
      throw new Error('Task not found')
    }

    // Check if parent task exists if parentId is provided
    if (taskData.parentId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: taskData.parentId }
      })
      if (!parentTask) {
        throw new Error('Parent task not found')
      }
      // Prevent circular references
      if (taskData.parentId === id) {
        throw new Error('Task cannot be its own parent')
      }
    }

    // Update task and tags in a transaction
    const task = await prisma.$transaction(async (tx: any) => {
      // Update task
      const updatedTask = await tx.task.update({
        where: { id },
        data: taskData,
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

      // Update tags if provided
      if (tagIds !== undefined) {
        // Remove existing tags
        await tx.taskTag.deleteMany({
          where: { taskId: id }
        })

        // Add new tags
        if (tagIds.length > 0) {
          await tx.taskTag.createMany({
            data: tagIds.map((tagId) => ({
              taskId: id,
              tagId
            }))
          })
        }

        // Fetch updated task with new tags
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

  async deleteTask(id: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      throw new Error('Task not found')
    }

    await prisma.task.delete({
      where: { id }
    })
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
      subtasks: task.subtasks.map((subtask: any) =>
        this.formatTaskWithSubtasks(subtask)
      ),
      tags: task.tags.map((taskTag: any) => taskTag.tag)
    }
  }
}
