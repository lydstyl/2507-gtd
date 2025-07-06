import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/services/authService'
import { PrismaUserRepository } from '../src/infrastructure/repositories/PrismaUserRepository'

const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)
const authService = new AuthService(userRepository)

describe('CSV Import Tests', () => {
  const testEmail = 'test-csv-import@example.com'
  const testPassword = 'test-password-123'
  let userId: string
  let authToken: string
  let server: any

  beforeAll(async () => {
    // Nettoyer les données de test existantes
    await prisma.task.deleteMany({ where: { user: { email: testEmail } } })
    await prisma.tag.deleteMany({ where: { user: { email: testEmail } } })
    await prisma.user.deleteMany({ where: { email: testEmail } })

    // Créer l'utilisateur de test
    const user = await authService.register(testEmail, testPassword)
    userId = user.id
    const authResult = await authService.login(testEmail, testPassword)
    authToken = authResult.token
    server = app.listen(4002)
  })

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { user: { email: testEmail } } })
    await prisma.tag.deleteMany({ where: { user: { email: testEmail } } })
    await prisma.user.deleteMany({ where: { email: testEmail } })
    await prisma.$disconnect()
    server.close()
  })

  test('should import tasks from CSV and create tags', async () => {
    const csvContent = [
      'ID,Nom,Lien,Importance,Urgence,Priorité,Date limite,Date de création,Date de modification,Tâche parente,Tags',
      ',Tâche importée 1,,1,2,3,2025-07-20,,,,Tag1;Tag2',
      ',Tâche importée 2,https://import2.com,5,5,5,,,,,Tag2',
      ',Tâche importée 3,,3,3,3,,,,,'
    ].join('\n')

    // Import via l'API
    const importRes = await request(server)
      .post('/api/tasks/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ csvContent })
      .expect(200)

    expect(importRes.body.importedCount).toBe(3)
    expect(importRes.body.errors).toHaveLength(0)

    // Vérifier que les tâches sont bien importées
    const tasksRes = await request(server)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    const tasks = tasksRes.body
    expect(tasks.length).toBeGreaterThanOrEqual(3)
    const t1 = tasks.find((t: any) => t.name === 'Tâche importée 1')
    const t2 = tasks.find((t: any) => t.name === 'Tâche importée 2')
    const t3 = tasks.find((t: any) => t.name === 'Tâche importée 3')
    expect(t1).toBeDefined()
    expect(t2).toBeDefined()
    expect(t3).toBeDefined()
    expect(t1.tags.map((tag: any) => tag.name).sort()).toEqual(['Tag1', 'Tag2'])
    expect(t2.tags.map((tag: any) => tag.name)).toEqual(['Tag2'])
    expect(t3.tags).toEqual([])
    expect(t1.importance).toBe(1)
    expect(t1.urgency).toBe(2)
    expect(t1.priority).toBe(3)
    expect(t1.dueDate).toContain('2025-07-20')
    expect(t2.link).toBe('https://import2.com')
  })

  test('should reject import without authentication', async () => {
    const csvContent =
      'ID,Nom,Lien,Importance,Urgence,Priorité,Date limite,Date de création,Date de modification,Tâche parente,Tags\n,Tâche sans auth,,5,5,5,,,,,'
    await request(server)
      .post('/api/tasks/import')
      .send({ csvContent })
      .expect(401)
  })

  test('should return errors for invalid CSV', async () => {
    const csvContent = [
      'ID,Nom,Lien,Importance,Urgence,Priorité,Date limite,Date de création,Date de modification,Tâche parente,Tags',
      ',,Lien manquant,abc,2,3,2025-07-20,,,,Tag1;Tag2', // nom manquant, importance invalide
      ',Tâche mauvaise importance,,abc,2,3,2025-07-20,,,,Tag1;Tag2' // importance invalide
    ].join('\n')

    const importRes = await request(server)
      .post('/api/tasks/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ csvContent })
      .expect(200)

    expect(importRes.body.importedCount).toBe(0)
    expect(importRes.body.errors.length).toBeGreaterThan(0)
    expect(importRes.body.errors.join(' ')).toMatch(
      /nom de la tâche|Importance invalide/i
    )
  })
})
