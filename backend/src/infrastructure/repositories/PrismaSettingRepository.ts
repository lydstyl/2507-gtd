import { PrismaClient } from '@prisma/client'
import { SettingRepository } from '../../interfaces/repositories/SettingRepository'
import { Setting } from '../../domain/entities/Setting'

export class PrismaSettingRepository implements SettingRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(userId: string): Promise<Setting[]> {
    const rows = await this.prisma.setting.findMany({ where: { userId } })
    return rows as Setting[]
  }

  async findByKey(userId: string, key: string): Promise<Setting | null> {
    const row = await this.prisma.setting.findUnique({
      where: { key_userId: { key, userId } }
    })
    return (row as Setting) || null
  }

  async upsert(userId: string, key: string, value: string): Promise<Setting> {
    const row = await this.prisma.setting.upsert({
      where: { key_userId: { key, userId } },
      create: { key, value, userId },
      update: { value }
    })
    return row as Setting
  }
}
