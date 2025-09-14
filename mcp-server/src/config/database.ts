import { PrismaClient } from '@prisma/client';

export class DatabaseConfig {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL || 'file:../backend/prisma/dev.db'
          }
        }
      });
    }
    return DatabaseConfig.instance;
  }

  static async disconnect(): Promise<void> {
    if (DatabaseConfig.instance) {
      await DatabaseConfig.instance.$disconnect();
    }
  }
}