import { PrismaClient } from '@prisma/client'
import { ApiKeyRecord, IApiKeyRepository } from '../../interfaces/repositories/ApiKeyRepository'

export class PrismaApiKeyRepository implements IApiKeyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    name: string
    keyHash: string
    prefix: string
    userId: string
    expiresAt?: Date
  }): Promise<ApiKeyRecord> {
    return this.prisma.apiKey.create({ data })
  }

  async findByUserId(userId: string): Promise<Omit<ApiKeyRecord, 'keyHash'>[]> {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        userId: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string): Promise<ApiKeyRecord | null> {
    return this.prisma.apiKey.findUnique({ where: { id } })
  }

  async findByPrefix(prefix: string): Promise<ApiKeyRecord[]> {
    return this.prisma.apiKey.findMany({ where: { prefix } })
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    })
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.apiKey.deleteMany({ where: { id, userId } })
    return result.count > 0
  }
}
