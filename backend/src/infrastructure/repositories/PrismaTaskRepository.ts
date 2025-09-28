import { PrismaClient } from '@prisma/client'
import {
  TaskRepository,
  TaskFilters,
  CompletionStats
} from '../../interfaces/repositories/TaskRepository'
import {
  Task,
  TaskWithSubtasks,
  CreateTaskData,
  UpdateTaskData
} from '../../domain/entities/Task'
import { TaskWithTags } from '../../application/services/CsvService'
import { TaskPriorityService, TaskValidationService } from '@gtd/shared'
import { TaskSorting } from './TaskSorting'

export class PrismaTaskRepository implements TaskRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTaskData): Promise<TaskWithSubtasks> {
    const { tagIds, ...taskData } = data
    const defaults = TaskValidationService.getDefaultTaskValues()

    // Use provided values or defaults
    const importance = taskData.importance ?? defaults.importance
    const complexity = taskData.complexity ?? defaults.complexity

    // Compute points server-side (client values ignored)
    const points = TaskPriorityService.calculatePoints(importance, complexity)

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        importance,
        complexity,
        points,
        plannedDate: taskData.plannedDate ? new Date(taskData.plannedDate) : undefined,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        userId: taskData.userId,
        parentId: taskData.parentId,
        completedAt: taskData.isCompleted ? new Date() : undefined,
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
            tags: { include: { tag: true } },
            subtasks: {
              include: {
                tags: { include: { tag: true } },
                subtasks: true // profondeur 2 (suffisant pour la plupart des cas)
              }
            }
          }
        }
      }
    })

    return task ? this.formatTaskWithSubtasks(task) : null
  }

  async findAll(filters: TaskFilters): Promise<TaskWithSubtasks[]> {
    const where: any = {}

    // userId est obligatoire pour la sécurité
    where.userId = filters.userId

    if (filters?.parentId !== undefined) {
      // Si parentId est explicitement spécifié (même null), on l'utilise
      where.parentId = filters.parentId
    }
    // Si parentId n'est pas défini, on ne filtre pas par parentId (récupère toutes les tâches)

    if (filters?.importance !== undefined) {
      where.importance = filters.importance
    }

    if (filters?.complexity !== undefined) {
      where.complexity = filters.complexity
    }

    if (filters?.points !== undefined) {
      where.points = filters.points
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
            tags: { include: { tag: true } },
            subtasks: {
              include: {
                tags: { include: { tag: true } },
                subtasks: true // profondeur 2 (suffisant pour la plupart des cas)
              }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' } // Tri de base par date de création
      ]
    })

    // Appliquer le tri personnalisé
    const sortedTasks = TaskSorting.sortTasksByPriority(
      tasks.map((task: any) => this.formatTaskWithSubtasks(task))
    )

    return sortedTasks
  }

  async findAllRootTasks(filters: TaskFilters): Promise<TaskWithSubtasks[]> {
    const where: any = {}

    // userId est obligatoire pour la sécurité
    where.userId = filters.userId

    // Pour les tâches racines, on force parentId = null
    where.parentId = null

    // Exclure les tâches terminées de la liste des tâches
    where.isCompleted = false

    if (filters?.importance !== undefined) {
      where.importance = filters.importance
    }

    if (filters?.complexity !== undefined) {
      where.complexity = filters.complexity
    }

    if (filters?.points !== undefined) {
      where.points = filters.points
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
            tags: { include: { tag: true } },
            subtasks: {
              include: {
                tags: { include: { tag: true } },
                subtasks: true // profondeur 2 (suffisant pour la plupart des cas)
              }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' } // Tri de base par date de création
      ]
    })

    // Appliquer le tri personnalisé
    const sortedTasks = TaskSorting.sortTasksByPriority(
      tasks.map((task: any) => this.formatTaskWithSubtasks(task))
    )

    return sortedTasks
  }

  async update(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks> {
    const { tagIds, ...taskData } = data
    const { subtasks, tags, ...cleanTaskData } = taskData as any

    const task = await this.prisma.$transaction(async (tx: any) => {
      // Get current task to check if importance/complexity changed
      const currentTask = await tx.task.findUnique({
        where: { id },
        select: { importance: true, complexity: true }
      })

      if (!currentTask) {
        throw new Error(`Task with id ${id} not found`)
      }

      // Prepare update data
      const updateData: any = {
        ...cleanTaskData,
        plannedDate:
          cleanTaskData.plannedDate !== undefined
            ? cleanTaskData.plannedDate
              ? new Date(cleanTaskData.plannedDate)
              : null
            : undefined,
        dueDate:
          cleanTaskData.dueDate !== undefined
            ? cleanTaskData.dueDate
              ? new Date(cleanTaskData.dueDate)
              : null
            : undefined,
        userId: cleanTaskData.userId
      }

      // Recompute points if importance or complexity changed
      const newImportance = cleanTaskData.importance ?? currentTask.importance
      const newComplexity = cleanTaskData.complexity ?? currentTask.complexity

      if (cleanTaskData.importance !== undefined || cleanTaskData.complexity !== undefined) {
        updateData.points = TaskPriorityService.calculatePoints(newImportance, newComplexity)
      }

      const updatedTask = await tx.task.update({
        where: { id },
        data: updateData,
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

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.prisma.task.deleteMany({ where: { userId } })
  }

  async exists(id: string): Promise<boolean> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true }
    })
    return !!task
  }

  async getAllTasksWithTags(userId: string): Promise<TaskWithTags[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        parent: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return tasks.map((task: any) => ({
      ...task,
      parentName: task.parent?.name
    })) as unknown as TaskWithTags[]
  }

  async markAsCompleted(id: string, userId: string): Promise<TaskWithSubtasks> {
    const task = await this.prisma.task.update({
      where: {
        id,
        userId // Security: ensure user owns the task
      },
      data: {
        isCompleted: true,
        completedAt: new Date()
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        subtasks: {
          include: {
            tags: { include: { tag: true } },
            subtasks: {
              include: {
                tags: { include: { tag: true } },
                subtasks: true
              }
            }
          }
        }
      }
    })

    return this.formatTaskWithSubtasks(task)
  }

  async getCompletionStats(userId: string): Promise<CompletionStats> {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000)

    // Get daily completions for last 7 days
    const dailyTasks = await this.prisma.task.findMany({
      where: {
        userId,
        isCompleted: true,
        completedAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        id: true,
        name: true,
        completedAt: true
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Group by date
    const dailyCompletions = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const tasksForDate = dailyTasks.filter((task: { id: string; name: string; completedAt: Date | null }) =>
        task.completedAt && task.completedAt.toISOString().split('T')[0] === dateStr
      )

      dailyCompletions.push({
        date: dateStr,
        count: tasksForDate.length,
        tasks: tasksForDate.map((task: { id: string; name: string; completedAt: Date | null }) => ({ id: task.id, name: task.name }))
      })
    }

    // Get weekly completions for last 8 weeks
    const weeklyCompletions = []
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)

      const count = await this.prisma.task.count({
        where: {
          userId,
          isCompleted: true,
          completedAt: {
            gte: weekStart,
            lt: weekEnd
          }
        }
      })

      weeklyCompletions.push({
        weekStart: weekStart.toISOString().split('T')[0],
        count
      })
    }

    return {
      dailyCompletions: dailyCompletions.reverse(), // Most recent first
      weeklyCompletions: weeklyCompletions.reverse() // Most recent first
    }
  }

  async getCompletedTasks(userId: string, startDate: Date, endDate: Date): Promise<TaskWithSubtasks[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        isCompleted: true,
        completedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        subtasks: {
          include: {
            tags: { include: { tag: true } },
            subtasks: {
              include: {
                tags: { include: { tag: true } },
                subtasks: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    return tasks.map((task: any) => this.formatTaskWithSubtasks(task))
  }

  async deleteOldCompletedTasks(cutoffDate: Date): Promise<number> {
    const result = await this.prisma.task.deleteMany({
      where: {
        isCompleted: true,
        completedAt: {
          lt: cutoffDate
        }
      }
    })

    return result.count
  }


  private formatTaskWithSubtasks(task: any): TaskWithSubtasks {
    return {
      id: task.id,
      name: task.name,
      link: task.link,
      note: task.note,
      importance: task.importance,
      complexity: task.complexity,
      points: task.points,
      plannedDate: task.plannedDate ? task.plannedDate.toISOString() : undefined,
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      isCompleted: task.isCompleted,
      completedAt: task.completedAt ? task.completedAt.toISOString() : undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      parentId: task.parentId,
      userId: task.userId,
      subtasks: (task.subtasks || []).map((subtask: any) =>
        this.formatTaskWithSubtasks(subtask)
      ),
      tags: (task.tags || []).map((taskTag: any) => taskTag.tag)
    }
  }
}
