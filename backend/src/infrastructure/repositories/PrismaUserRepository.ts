import { PrismaClient } from '@prisma/client'
import { UserRepository } from '../../interfaces/repositories/UserRepository'
import { User } from '../../domain/entities/User'

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } })
  }

  async create(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'tags'>
  ): Promise<User> {
    return await this.prisma.user.create({ data: user })
  }
}
