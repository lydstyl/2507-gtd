-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('brouillon', 'pour_ia', 'collecte', 'un_jour_peut_etre');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'brouillon';

-- Data migration: mark existing collected tasks (importance=0, complexity=3) as 'collecte'
UPDATE "tasks" SET "status" = 'collecte' WHERE "importance" = 0 AND "complexity" = 3;
