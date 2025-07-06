import { PrismaClient } from '@prisma/client'
import {
  TaskRepository,
  TaskFilters
} from '../../interfaces/repositories/TaskRepository'
import {
  Task,
  TaskWithSubtasks,
  CreateTaskData,
  UpdateTaskData
} from '../../domain/entities/Task'
import { TaskWithTags } from '../../services/csvService'

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
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        userId: taskData.userId,
        parentId: taskData.parentId, // S'assurer que parentId est inclus
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
    } else {
      // Par défaut, on ne récupère que les tâches principales (sans parent)
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
    const sortedTasks = this.sortTasksByPriority(
      tasks.map((task) => this.formatTaskWithSubtasks(task))
    )

    return sortedTasks
  }

  async update(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks> {
    // Filtrer les champs qui ne doivent pas être envoyés à Prisma
    const { tagIds, ...taskData } = data
    const { subtasks, tags, ...cleanTaskData } = taskData as any

    const task = await this.prisma.$transaction(async (tx: any) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...cleanTaskData,
          dueDate:
            cleanTaskData.dueDate !== undefined
              ? cleanTaskData.dueDate
                ? new Date(cleanTaskData.dueDate)
                : null
              : undefined,
          userId: cleanTaskData.userId
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

    return tasks.map(task => ({
      ...task,
      parentName: task.parent?.name
    })) as TaskWithTags[]
  }

  private sortTasksByPriority(tasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

    return tasks
      .sort((a, b) => {
        // 1. Tâches rapides SANS date en premier (importance=5, urgence=5, priorité=5, pas de date)
        const aIsQuickNoDate =
          a.importance === 5 &&
          a.urgency === 5 &&
          a.priority === 5 &&
          !a.dueDate
        const bIsQuickNoDate =
          b.importance === 5 &&
          b.urgency === 5 &&
          b.priority === 5 &&
          !b.dueDate

        if (aIsQuickNoDate && !bIsQuickNoDate) return -1
        if (!aIsQuickNoDate && bIsQuickNoDate) return 1
        if (aIsQuickNoDate && bIsQuickNoDate) return 0

        // 2. Tâches en retard (dates passées)
        const aIsOverdue = a.dueDate && new Date(a.dueDate) < today
        const bIsOverdue = b.dueDate && new Date(b.dueDate) < today

        if (aIsOverdue && !bIsOverdue) return -1
        if (!aIsOverdue && bIsOverdue) return 1
        if (aIsOverdue && bIsOverdue) {
          // Tri des tâches en retard par importance, urgence, priorité
          return this.compareByPriority(a, b)
        }

        // 3. Tâches d'aujourd'hui
        const aIsToday =
          a.dueDate &&
          new Date(a.dueDate).toDateString() === today.toDateString()
        const bIsToday =
          b.dueDate &&
          new Date(b.dueDate).toDateString() === today.toDateString()

        if (aIsToday && !bIsToday) return -1
        if (!aIsToday && bIsToday) return 1
        if (aIsToday && bIsToday) {
          // Tri des tâches d'aujourd'hui par importance, urgence, priorité
          return this.compareByPriority(a, b)
        }

        // 4. Tâches de demain
        const aIsTomorrow =
          a.dueDate &&
          new Date(a.dueDate).toDateString() === tomorrow.toDateString()
        const bIsTomorrow =
          b.dueDate &&
          new Date(b.dueDate).toDateString() === tomorrow.toDateString()

        if (aIsTomorrow && !bIsTomorrow) return -1
        if (!aIsTomorrow && bIsTomorrow) return 1
        if (aIsTomorrow && bIsTomorrow) {
          // Tri des tâches de demain par importance, urgence, priorité
          return this.compareByPriority(a, b)
        }

        // 5. Tâches avec priorités définies (importance, urgence, priorité modifiées) - SANS date
        const aHasPriorityNoDate =
          (a.importance !== 5 || a.urgency !== 5 || a.priority !== 5) &&
          !a.dueDate
        const bHasPriorityNoDate =
          (b.importance !== 5 || b.urgency !== 5 || b.priority !== 5) &&
          !b.dueDate

        if (aHasPriorityNoDate && !bHasPriorityNoDate) return -1
        if (!aHasPriorityNoDate && bHasPriorityNoDate) return 1
        if (aHasPriorityNoDate && bHasPriorityNoDate) {
          // Tri des tâches avec priorités par importance, urgence, priorité
          return this.compareByPriority(a, b)
        }

        // 6. Tâches rapides AVEC dates éloignées (après demain) - en dernier, triées par date puis importance, urgence, priorité
        const aIsQuickWithDistantDate =
          a.importance === 5 &&
          a.urgency === 5 &&
          a.priority === 5 &&
          a.dueDate &&
          new Date(a.dueDate) >= dayAfterTomorrow
        const bIsQuickWithDistantDate =
          b.importance === 5 &&
          b.urgency === 5 &&
          b.priority === 5 &&
          b.dueDate &&
          new Date(b.dueDate) >= dayAfterTomorrow

        if (aIsQuickWithDistantDate && !bIsQuickWithDistantDate) return -1
        if (!aIsQuickWithDistantDate && bIsQuickWithDistantDate) return 1
        if (aIsQuickWithDistantDate && bIsQuickWithDistantDate) {
          // D'abord trier par date (croissant)
          const dateComparison =
            new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
          if (dateComparison !== 0) return dateComparison

          // Si même date, trier par importance, urgence, priorité
          return this.compareByPriority(a, b)
        }

        // 7. Tâches avec priorités définies ET dates éloignées (après demain)
        const aHasPriorityWithDistantDate =
          (a.importance !== 5 || a.urgency !== 5 || a.priority !== 5) &&
          a.dueDate &&
          new Date(a.dueDate) >= dayAfterTomorrow
        const bHasPriorityWithDistantDate =
          (b.importance !== 5 || b.urgency !== 5 || b.priority !== 5) &&
          b.dueDate &&
          new Date(b.dueDate) >= dayAfterTomorrow

        if (aHasPriorityWithDistantDate && !bHasPriorityWithDistantDate)
          return -1
        if (!aHasPriorityWithDistantDate && bHasPriorityWithDistantDate)
          return 1
        if (aHasPriorityWithDistantDate && bHasPriorityWithDistantDate) {
          // D'abord trier par date (croissant)
          const dateComparison =
            new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
          if (dateComparison !== 0) return dateComparison

          // Si même date, trier par importance, urgence, priorité
          return this.compareByPriority(a, b)
        }

        // 8. Si aucune catégorie, trier par date de création
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      .map((task) => ({
        ...task,
        subtasks: this.sortSubtasksByPriority(task.subtasks)
      }))
  }

  private sortSubtasksByPriority(
    subtasks: TaskWithSubtasks[]
  ): TaskWithSubtasks[] {
    return subtasks
      .sort((a, b) => this.compareByPriority(a, b))
      .map((subtask) => ({
        ...subtask,
        subtasks: this.sortSubtasksByPriority(subtask.subtasks)
      }))
  }

  private compareByPriority(a: TaskWithSubtasks, b: TaskWithSubtasks): number {
    // Tri par importance (croissant)
    if (a.importance !== b.importance) {
      return a.importance - b.importance
    }

    // Si importance égale, tri par urgence (croissant)
    if (a.urgency !== b.urgency) {
      return a.urgency - b.urgency
    }

    // Si urgence égale, tri par priorité (croissant)
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }

    // Si tout égal, tri par date de création (décroissant)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  }

  private formatTaskWithSubtasks(task: any): TaskWithSubtasks {
    return {
      id: task.id,
      name: task.name,
      link: task.link,
      note: task.note,
      importance: task.importance,
      urgency: task.urgency,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
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
