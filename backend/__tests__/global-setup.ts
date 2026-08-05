import { execSync } from 'child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import { config } from 'dotenv'
import { Client } from 'pg'
import {
  assertNotProductionDatabase,
  extractDatabaseName,
  maskDatabaseUrl,
  resolveTestDatabaseUrl,
  TEST_DB_NAME,
} from './db-test-utils'

/**
 * GlobalSetup Vitest — s'exécute UNE FOIS avant tous les tests, dans le processus principal.
 *
 * Objectifs :
 * 1. Résoudre la base de test (DATABASE_URL_TEST, sinon gtd_test dérivé de DATABASE_URL).
 * 2. PostgreSQL : créer la base si absente, puis appliquer les migrations Prisma (migrate deploy).
 * 3. Fallback SQLite : si PostgreSQL est indisponible, générer un schéma SQLite + db push,
 *    régénérer le client Prisma pour SQLite (restauré en globalTeardown).
 * 4. Définir process.env.DATABASE_URL pour que TOUS les tests (et PrismaClient) pointent
 *    vers la base de test — jamais la production.
 */

export interface TestDatabaseConfig {
  driver: 'postgres' | 'sqlite'
  databaseUrl: string
  sqliteSchemaPath?: string
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  // Charge .env racine (CWD = backend/ pendant les tests)
  config({ path: '../.env' })

  const backendDir = process.cwd()
  const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma')
  const sqliteSchemaPath = path.join(backendDir, 'prisma', 'schema.sqlite.prisma')

  // 1. Résoudre la cible + garde-fou anti-production (double protection)
  const testUrl = resolveTestDatabaseUrl()
  assertNotProductionDatabase(testUrl, 'globalSetup')

  // 2. Tentative PostgreSQL d'abord (source de vérité : migrations Prisma)
  try {
    const ok = await setupPostgresTestDatabase(testUrl, schemaPath, backendDir)
    if (ok) {
      process.env.DATABASE_URL = testUrl
      console.log(`\n✅ Base de test PostgreSQL prête : ${maskDatabaseUrl(testUrl)}`)
      // Rien à restaurer en mode PostgreSQL
      return async () => {}
    }
  } catch (error) {
    console.warn(
      `⚠️  PostgreSQL indisponible pour les tests (${(error as Error).message}). Bascule sur SQLite.`
    )
  }

  // 3. Fallback SQLite
  const sqliteUrl = setupSqliteTestDatabase(schemaPath, sqliteSchemaPath, backendDir)
  process.env.DATABASE_URL = sqliteUrl
  console.log(`\n✅ Base de test SQLite prête : ${sqliteUrl}`)

  // Teardown : restaurer le client Prisma PostgreSQL et nettoyer les fichiers temporaires
  return async () => {
    console.log('\n♻️  Restauration du client Prisma PostgreSQL après tests SQLite...')
    execSync('npx prisma generate --schema prisma/schema.prisma', {
      cwd: backendDir,
      stdio: 'inherit',
    })
    if (existsSync(sqliteSchemaPath)) rmSync(sqliteSchemaPath, { force: true })
    const dbPath = sqliteUrl.replace(/^file:/, '')
    if (dbPath && existsSync(dbPath)) rmSync(dbPath, { force: true })
    console.log('✅ Client Prisma PostgreSQL restauré.')
  }
}

/**
 * PostgreSQL : crée la base de test si absente, applique les migrations, valide la connexion.
 * Retourne false si la connexion au serveur PostgreSQL échoue (→ bascule SQLite).
 */
async function setupPostgresTestDatabase(
  testUrl: string,
  schemaPath: string,
  backendDir: string
): Promise<boolean> {
  const dbName = extractDatabaseName(testUrl)
  const url = new URL(testUrl)

  // Connexion "admin" à la base `postgres` du même serveur pour CREATE DATABASE
  const adminClient = new Client({
    host: url.hostname,
    port: Number(url.port || 5432),
    user: url.username,
    password: url.password,
    database: 'postgres',
    connectionTimeoutMillis: 3000,
  })

  try {
    await adminClient.connect()
  } catch (error) {
    await adminClient.end().catch(() => {})
    throw new Error(`connexion au serveur PostgreSQL refusée (${(error as Error).message})`)
  }

  try {
    // Créer la base si absente (CREATE DATABASE ne peut pas être paramétré)
    const res = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
    if (res.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${dbName}"`)
      console.log(`   → Base "${dbName}" créée`)
    }
  } finally {
    await adminClient.end()
  }

  // Appliquer les migrations Prisma sur la base de test
  execSync('npx prisma migrate deploy --schema prisma/schema.prisma', {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testUrl },
  })

  // Valider la connexion avec le client de test
  const testClient = new Client({ connectionString: testUrl, connectionTimeoutMillis: 5000 })
  await testClient.connect()
  await testClient.end()

  return true
}

/**
 * Fallback SQLite : génère un schéma Prisma SQLite, applique le schéma (db push)
 * et régénère le client Prisma pour SQLite (restauré en teardown).
 */
function setupSqliteTestDatabase(
  schemaPath: string,
  sqliteSchemaPath: string,
  backendDir: string
): string {
  const original = readFileSync(schemaPath, 'utf8')
  if (original.includes('provider = "sqlite"')) {
    throw new Error('Le schéma source est déjà en SQLite — vérifier la configuration.')
  }

  const sqliteSchema = original
    .replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"')
    .replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = env("DATABASE_URL")')

  writeFileSync(sqliteSchemaPath, sqliteSchema)

  // Chemin absolu pour éviter toute ambiguïté de résolution relative
  const dbPath = path.join(backendDir, 'prisma', 'test.db')
  const sqliteUrl = `file:${dbPath}`

  // Créer les tables
  execSync('npx prisma db push --schema prisma/schema.sqlite.prisma --skip-generate', {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: sqliteUrl },
  })

  // Générer le client Prisma adapté à SQLite (output par défaut)
  execSync('npx prisma generate --schema prisma/schema.sqlite.prisma', {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: sqliteUrl },
  })

  return sqliteUrl
}
