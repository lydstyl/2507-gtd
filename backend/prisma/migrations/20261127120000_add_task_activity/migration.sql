-- CréationTable de la colonne activity (activité agent en temps réel, 27/11/2026)
ALTER TABLE "tasks" ADD COLUMN "activity" TEXT;
ALTER TABLE "tasks" ADD COLUMN "activityAt" TIMESTAMP(3);
