import { PrismaClient } from '@prisma/client'
import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { Tag, CreateTagData, UpdateTagData } from '../../domain/entities/Tag'

export class PrismaTagRepository implements TagRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTagData): Promise<Tag> {
    let position = data.position

    if (position === undefined) {
      const maxPosition = await this.prisma.tag.aggregate({
        where: { userId: data.userId },
        _max: { position: true }
      })
      position = (maxPosition._max.position || -1) + 1
    }

    const tag = await this.prisma.tag.create({
      data: {
        ...data,
        position,
        userId: data.userId
      }
    })

    return tag as Tag
  }

  async findById(id: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({
      where: { id }
    })

    return tag as Tag | null
  }

  async findAll(userId: string): Promise<Tag[]> {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      orderBy: { position: 'asc' }
    })

    return tags as Tag[]
  }

  async update(id: string, data: UpdateTagData): Promise<Tag> {
    const tag = await this.prisma.tag.update({
      where: { id },
      data
    })

    return tag as Tag
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

    return taskTags.map((taskTag: any) => taskTag.tag as Tag)
  }

  async findByNameAndUser(name: string, userId: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findFirst({
      where: {
        name,
        userId
      }
    })

    return tag as Tag | null
  }

  async updatePositions(userId: string, tagPositions: { id: string; position: number }[]): Promise<void> {
    await this.prisma.$transaction(
      tagPositions.map(({ id, position }) =>
        this.prisma.tag.update({
          where: { id },
          data: { position }
        })
      )
    )
  }
}
