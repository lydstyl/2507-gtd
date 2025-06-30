import { PrismaClient } from '@prisma/client'
import { CreateTagRequest, UpdateTagRequest, Tag } from '../types'

const prisma = new PrismaClient()

export class TagService {
  async createTag(data: CreateTagRequest): Promise<Tag> {
    const tag = await prisma.tag.create({
      data
    })

    return tag
  }

  async getTagById(id: string): Promise<Tag | null> {
    const tag = await prisma.tag.findUnique({
      where: { id }
    })

    return tag
  }

  async getAllTags(): Promise<Tag[]> {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })

    return tags
  }

  async updateTag(id: string, data: UpdateTagRequest): Promise<Tag> {
    const tag = await prisma.tag.update({
      where: { id },
      data
    })

    return tag
  }

  async deleteTag(id: string): Promise<void> {
    await prisma.tag.delete({
      where: { id }
    })
  }

  async getTagsByTaskId(taskId: string): Promise<Tag[]> {
    const taskTags = await prisma.taskTag.findMany({
      where: { taskId },
      include: { tag: true }
    })

    return taskTags.map((taskTag) => taskTag.tag)
  }
}
