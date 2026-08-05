import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { assertNotProductionDatabase, cleanTestDatabase } from './db-test-utils'

/**
 * SetupFiles Vitest — s'exécute avant les tests dans chaque worker.
 *
 * Le globalSetup a déjà défini process.env.DATABASE_URL vers la base de test
 * (gtd_test PostgreSQL, ou test.db SQLite en fallback). Ce fichier :
 * 1. Charge le .env racine SANS écraser DATABASE_URL (dotenv ne surcharge pas).
 * 2. Re-vérifie le garde-fou anti-production (double sécurité).
 * 3. Nettoie entièrement la base de test pour un état vierge à chaque run.
 */

// dotenv ne surcharge PAS les variables déjà définies par le globalSetup
config({ path: '../.env' })

// Garde-fou : si DATABASE_URL pointe vers la production, on refuse de continuer.
// Sans cette vérification, un PrismaClient créé dans les tests écrirait dans la prod.
assertNotProductionDatabase(process.env.DATABASE_URL ?? '', 'setup.ts')

const prisma = new PrismaClient()

// État vierge de la base de test avant chaque run de tests
beforeAll(async () => {
  await cleanTestDatabase(prisma)
  console.log('✅ Base de test nettoyée (état vierge)')
}, 30000)

afterAll(async () => {
  await prisma.$disconnect()
}, 30000)
