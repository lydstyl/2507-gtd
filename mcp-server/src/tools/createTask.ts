import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { CreateTaskData, TaskWithSubtasks } from '../types/task.js';

export const CreateTaskSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Task name is required'),
  importance: z.number().min(1).max(100).optional().default(50),
  complexity: z.number().min(1).max(5).optional().default(1),
  link: z.string().optional(),
  note: z.string().optional(),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  parentId: z.string().optional(),
  tagIds: z.array(z.string()).optional()
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export class TaskCreator {
  constructor(private prisma: PrismaClient) {}

  async createTask(data: CreateTaskInput): Promise<TaskWithSubtasks> {
    // Validate that user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      throw new Error(`User with ID ${data.userId} not found`);
    }

    // Validate parent task if specified
    if (data.parentId) {
      const parentTask = await this.prisma.task.findFirst({
        where: { 
          id: data.parentId,
          userId: data.userId // Ensure user owns the parent task
        }
      });

      if (!parentTask) {
        throw new Error(`Parent task with ID ${data.parentId} not found or not owned by user`);
      }
    }

    // Validate tag ownership if specified
    if (data.tagIds && data.tagIds.length > 0) {
      const userTags = await this.prisma.tag.findMany({
        where: {
          id: { in: data.tagIds },
          userId: data.userId
        }
      });

      if (userTags.length !== data.tagIds.length) {
        throw new Error('Some specified tags do not exist or are not owned by the user');
      }
    }

    // Create the task
    const { tagIds, ...taskData } = data;

    // Calculate points based on importance and complexity
    const importance = taskData.importance || 50;
    const complexity = taskData.complexity || 1;
    const points = importance * complexity * 10;

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        importance,
        complexity,
        points,
        dueDate: taskData.dueDate,
        userId: taskData.userId,
        parentId: taskData.parentId,
        tags: tagIds ? {
          create: tagIds.map((tagId) => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        } : undefined
      } as any,
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
    });

    return this.formatTaskWithSubtasks(task);
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