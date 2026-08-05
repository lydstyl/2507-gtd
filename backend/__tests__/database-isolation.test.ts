import { describe, it, expect } from 'vitest'
import {
  assertNotProductionDatabase,
  extractDatabaseName,
  maskDatabaseUrl,
  resolveTestDatabaseUrl,
  TEST_DB_NAME,
} from './db-test-utils'

/**
 * Tests du garde-fou d'isolation : les tests ne doivent JAMAIS pointer vers la production.
 * Ces tests sont purement unitaires — aucune connexion de base de données.
 */
describe('Isolation base de données de test', () => {
  describe('extractDatabaseName', () => {
    it('extrait le nom depuis une URL PostgreSQL', () => {
      expect(
        extractDatabaseName('postgresql://gtd_user:secret@localhost:5436/gtd_test')
      ).toBe('gtd_test')
    })

    it('extrait le nom depuis une URL SQLite', () => {
      expect(extractDatabaseName('file:/tmp/backend/prisma/test.db')).toBe(
        '/tmp/backend/prisma/test.db'
      )
    })

    it('retourne une chaîne vide pour une URL invalide', () => {
      expect(extractDatabaseName('')).toBe('')
    })
  })

  describe('assertNotProductionDatabase', () => {
    it('refuse gtd_production (exact)', () => {
      expect(() =>
        assertNotProductionDatabase(
          'postgresql://gtd_user:secret@localhost:5436/gtd_production',
          'test'
        )
      ).toThrow(/REFUS/)
    })

    it('refuse toute base finissant par _production ou _prod', () => {
      expect(() =>
        assertNotProductionDatabase('postgresql://u:p@h:5432/myapp_production', 'test')
      ).toThrow(/REFUS/)
      expect(() =>
        assertNotProductionDatabase('postgresql://u:p@h:5432/myapp_prod', 'test')
      ).toThrow(/REFUS/)
    })

    it('refuse une base nommée production', () => {
      expect(() =>
        assertNotProductionDatabase('postgresql://u:p@h:5432/production', 'test')
      ).toThrow(/REFUS/)
    })

    it('accepte gtd_test', () => {
      expect(() =>
        assertNotProductionDatabase(
          'postgresql://gtd_user:secret@localhost:5436/gtd_test',
          'test'
        )
      ).not.toThrow()
    })

    it('accepte une base de test arbitraire', () => {
      expect(() =>
        assertNotProductionDatabase('postgresql://u:p@h:5432/gtd_test_ci', 'test')
      ).not.toThrow()
    })

    it('refuse une URL vide ou sans nom de base', () => {
      expect(() => assertNotProductionDatabase('', 'test')).toThrow(/Refus/)
      expect(() =>
        assertNotProductionDatabase('postgresql://u:p@h:5432/', 'test')
      ).toThrow(/Refus/)
    })
  })

  describe('resolveTestDatabaseUrl', () => {
    // Sauvegarder spécifiquement les variables touchées pour restaurer l'env du worker
    const originalTestUrl = process.env.DATABASE_URL_TEST
    const originalUrl = process.env.DATABASE_URL

    afterEach(() => {
      if (originalTestUrl === undefined) delete process.env.DATABASE_URL_TEST
      else process.env.DATABASE_URL_TEST = originalTestUrl
      if (originalUrl === undefined) delete process.env.DATABASE_URL
      else process.env.DATABASE_URL = originalUrl
    })

    it('utilise DATABASE_URL_TEST si défini', () => {
      process.env.DATABASE_URL_TEST = 'postgresql://u:p@h:5432/gtd_test_ci'
      process.env.DATABASE_URL = 'postgresql://u:p@h:5436/gtd_production'
      expect(resolveTestDatabaseUrl()).toBe('postgresql://u:p@h:5432/gtd_test_ci')
    })

    it('dérive gtd_test depuis DATABASE_URL si DATABASE_URL_TEST absent', () => {
      delete process.env.DATABASE_URL_TEST
      process.env.DATABASE_URL = 'postgresql://u:p@h:5436/gtd_production'
      expect(resolveTestDatabaseUrl()).toBe(
        `postgresql://u:p@h:5436/${TEST_DB_NAME}`
      )
    })

    it('lève une erreur si aucune variable définie', () => {
      delete process.env.DATABASE_URL_TEST
      delete process.env.DATABASE_URL
      expect(() => resolveTestDatabaseUrl()).toThrow(/DATABASE_URL/)
    })
  })

  describe('maskDatabaseUrl', () => {
    it('masque le mot de passe', () => {
      const masked = maskDatabaseUrl('postgresql://gtd_user:supersecret@localhost:5436/gtd_test')
      expect(masked).not.toContain('supersecret')
      expect(masked).toContain('gtd_user:***@localhost:5436/gtd_test')
    })
  })
})
