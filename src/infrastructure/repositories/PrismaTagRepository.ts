import { PrismaClient } from '@prisma/client'
import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { Tag, CreateTagData, UpdateTagData } from '../../domain/entities/Tag'

export class PrismaTagRepository implements TagRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTagData): Promise<Tag> {
    const tag = await this.prisma.tag.create({
      data
    })

    return tag
  }

  async findById(id: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({
      where: { id }
    })

    return tag
  }

  async findAll(): Promise<Tag[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })

    return tags
  }

  async update(id: string, data: UpdateTagData): Promise<Tag> {
    const tag = await this.prisma.tag.update({
      where: { id },
      data
    })

    return tag
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tag.delete({
      where: { id }
    })
  }

  async findByTaskId(taskId: string): Promise<Tag[]> {
    const taskTags = await this.prisma.taskTag.findMany({
      where: { taskId },
      include: { tag: true }
    })

    return taskTags.map((taskTag) => taskTag.tag)
  }
}
