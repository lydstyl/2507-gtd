import { PrismaClient } from '@prisma/client'

/**
 * Utilitaires de base de données pour les tests.
 *
 * Garantie centrale : les tests ne doivent JAMAIS toucher la base de production.
 * Toute URL qui pointe vers une base de production provoque un refus explicite.
 */

/** Noms de bases réservés à la production — interdits pour les tests. */
const PROD_DB_NAMES = ['gtd_production', 'production', 'prod']

/** Nom de la base de test par défaut. */
export const TEST_DB_NAME = 'gtd_test'

/**
 * Extrait le nom de la base de données d'une URL de connexion.
 * Gère PostgreSQL (postgresql://user:pass@host:port/db) et SQLite (file:...).
 */
export function extractDatabaseName(url: string): string {
  if (!url) return ''
  if (url.startsWith('file:')) {
    return url.replace(/^file:/, '').split(/[?#]/)[0]
  }
  try {
    const u = new URL(url)
    return u.pathname.replace(/^\//, '').replace(/\/$/, '')
  } catch {
    return url
  }
}

/**
 * Garde-fou : lève une erreur explicite si l'URL pointe vers une base de production.
 * À appeler dans le globalSetup ET dans le setupFiles pour une double sécurité.
 */
export function assertNotProductionDatabase(url: string, context: string): void {
  const dbName = extractDatabaseName(url)
  if (!dbName) {
    throw new Error(
      `[${context}] Impossible de déterminer le nom de la base de données depuis : "${url}". ` +
        'Refus de lancer les tests sans cible sûre.'
    )
  }

  const isProd =
    PROD_DB_NAMES.includes(dbName) ||
    PROD_DB_NAMES.some((name) => dbName.endsWith(`_${name}`)) ||
    PROD_DB_NAMES.some((name) => dbName.endsWith(`-${name}`))

  if (isProd) {
    throw new Error(
      `[${context}] REFUS : la base "${dbName}" est une base de production.\n` +
        'Les tests ne doivent JAMAIS toucher la production.\n' +
        `Définissez DATABASE_URL_TEST (ex: postgresql://.../${TEST_DB_NAME}) ou laissez ` +
        'le globalSetup dériver automatiquement une base de test.'
    )
  }
}

/**
 * Résout l'URL de la base de test :
 * 1. DATABASE_URL_TEST si définie ;
 * 2. sinon DATABASE_URL avec le nom de la base remplacé par gtd_test.
 */
export function resolveTestDatabaseUrl(): string {
  const testUrl = process.env.DATABASE_URL_TEST?.trim()
  if (testUrl) return testUrl

  const prodUrl = process.env.DATABASE_URL
  if (!prodUrl) {
    throw new Error('DATABASE_URL ou DATABASE_URL_TEST est requis pour les tests.')
  }
  if (!/^postgres(ql)?:\/\//.test(prodUrl)) {
    throw new Error(
      `DATABASE_URL doit être une URL PostgreSQL pour dériver la base de test (reçu: ${prodUrl.slice(0, 50)}…). ` +
        'Définissez DATABASE_URL_TEST explicitement.'
    )
  }
  return prodUrl.replace(/\/[^/]+$/, `/${TEST_DB_NAME}`)
}

/**
 * Masque le mot de passe d'une URL de connexion pour les logs.
 */
export function maskDatabaseUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.password) u.password = '***'
    return u.toString()
  } catch {
    return url
  }
}

/**
 * Nettoie entièrement la base de test (toutes les tables, ordre FK-safe).
 * Utilisé au démarrage pour garantir un état vierge à chaque run.
 */
export async function cleanTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.taskTag.deleteMany()
  await prisma.task.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.user.deleteMany()
}
