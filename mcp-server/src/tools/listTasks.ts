import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { TaskWithSubtasks } from '../types/task.js';

export const ListTasksSchema = z.object({
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  isCompleted: z.boolean().optional(),
  plannedDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  limit: z.number().min(1).max(100).optional().default(50)
}).refine((data) => data.userId || data.userEmail, {
  message: "Either userId or userEmail must be provided"
});

export type ListTasksInput = z.infer<typeof ListTasksSchema>;

export class TaskLister {
  constructor(private prisma: PrismaClient) {}

  async listTasks(data: ListTasksInput): Promise<TaskWithSubtasks[]> {
    // Find user by email if provided
    let userId = data.userId;

    if (data.userEmail && !userId) {
      const user = await this.prisma.user.findUnique({
        where: { email: data.userEmail }
      });

      if (!user) {
        throw new Error(`User with email ${data.userEmail} not found`);
      }

      userId = user.id;
    }

    if (!userId) {
      throw new Error('User ID could not be determined');
    }

    // Build the where clause
    const where: any = {
      userId,
      parentId: null // Only root tasks
    };

    if (data.isCompleted !== undefined) {
      where.isCompleted = data.isCompleted;
    }

    if (data.plannedDate) {
      const startOfDay = new Date(data.plannedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(data.plannedDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.plannedDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    if (data.dueDate) {
      const startOfDay = new Date(data.dueDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(data.dueDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.dueDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    // Fetch tasks
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
        { plannedDate: 'asc' },
        { points: 'desc' }
      ],
      take: data.limit
    });

    return tasks.map(task => this.formatTaskWithSubtasks(task));
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
      dueDate: task.dueDate,
      plannedDate: task.plannedDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      parentId: task.parentId,
      userId: task.userId,
      subtasks: (task.subtasks || []).map((subtask: any) =>
        this.formatTaskWithSubtasks(subtask)
      ),
      tags: (task.tags || []).map((taskTag: any) => taskTag.tag)
    };
  }
}
