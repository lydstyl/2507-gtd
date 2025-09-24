/*
  Warnings:

  - You are about to drop the column `dueDate` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `urgency` on the `tasks` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "link" TEXT,
    "note" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 50,
    "complexity" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL DEFAULT 500,
    "plannedDate" DATETIME,
    "date2" DATETIME,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "tasks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("createdAt", "id", "importance", "link", "name", "note", "parentId", "updatedAt", "userId") SELECT "createdAt", "id", "importance", "link", "name", "note", "parentId", "updatedAt", "userId" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
