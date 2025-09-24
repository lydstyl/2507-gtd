import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/services/authService'
import { PrismaUserRepository } from '../src/infrastructure/repositories/PrismaUserRepository'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'
import { PrismaTagRepository } from '../src/infrastructure/repositories/PrismaTagRepository'

const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)
const authService = new AuthService(userRepository)
const taskRepository = new PrismaTaskRepository(prisma)
const tagRepository = new PrismaTagRepository(prisma)

describe('CSV Export Tests', () => {
  const testEmail = 'test-csv-export@example.com'
  const testPassword = 'test-password-123'
  let userId: string
  let authToken: string
  let server: any

  beforeAll(async () => {
    // Créer un utilisateur de test
    const user = await authService.register(testEmail, testPassword)
    userId = user.id

    // Authentifier l'utilisateur pour obtenir le token
    const authResult = await authService.login(testEmail, testPassword)
    authToken = authResult.token

    server = app.listen(4002)
  }, 15000)

  afterAll(async () => {
    // Nettoyer après les tests
    await prisma.task.deleteMany({
      where: { user: { email: testEmail } }
    })
    await prisma.tag.deleteMany({
      where: { user: { email: testEmail } }
    })
    await prisma.user.deleteMany({
      where: { email: testEmail }
    })
    await prisma.$disconnect()
    if (server) server.close()
  }, 15000)

  test('should export tasks to CSV with authentication', async () => {
    console.log("\n🔄 Test d'export CSV...")

    // 1. Créer quelques tâches de test
    console.log('📝 1. Création des tâches de test...')

    const task1 = await taskRepository.create({
      name: 'Tâche importante',
      importance: 40,
      complexity: 2,
      link: 'https://example.com/important',
      dueDate: new Date('2025-07-10'),
      userId: userId
    })

    const task2 = await taskRepository.create({
      name: 'Tâche normale',
      importance: 25,
      complexity: 5,
      userId: userId
    })

    console.log('✅ Tâches créées:', [task1.name, task2.name])

    // 2. Créer un tag
    console.log("🏷️ 2. Création d'un tag...")
    const tag = await tagRepository.create({
      name: 'Test Tag',
      color: '#ff0000',
      userId: userId
    })

    // 3. Créer une tâche avec le tag
    console.log("📋 3. Création d'une tâche avec tag...")
    const taskWithTag = await taskRepository.create({
      name: 'Tâche avec tag',
      importance: 30,
      complexity: 4,
      userId: userId,
      tagIds: [tag.id]
    })

    console.log('✅ Tâche avec tag créée:', taskWithTag.name)

    // 4. Tester l'export CSV via l'API
    console.log("📤 4. Test de l'export CSV via API...")

    const exportResponse = await request(server)
      .get('/api/tasks/export')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    console.log(
      '✅ Export CSV réussi, taille:',
      exportResponse.body.length,
      'bytes'
    )

    // 5. Vérifier le contenu du CSV
    console.log('🔍 5. Vérification du contenu CSV...')

    const csvContent = exportResponse.text
    console.log('📄 Contenu CSV:')
    console.log(csvContent)

    // Vérifier que le CSV contient les en-têtes attendus
    expect(csvContent).toContain(
      'ID,Nom,Lien,Note,Importance,Complexité,Points,Date prévue,Date limite,Date de création,Date de modification,Tâche parente,Nom tâche parente,Tags'
    )

    // Vérifier que le CSV contient les tâches créées
    expect(csvContent).toContain('Tâche importante')
    expect(csvContent).toContain('Tâche normale')
    expect(csvContent).toContain('Tâche avec tag')

    // Vérifier que le CSV contient le tag
    expect(csvContent).toContain('Test Tag')

    // Vérifier que le CSV contient les bonnes valeurs
    expect(csvContent).toContain('40,2,200') // importance, complexité, points de la première tâche
    expect(csvContent).toContain('25,5,50') // importance, complexité, points de la deuxième tâche
    expect(csvContent).toContain('30,4,75') // importance, complexité, points de la tâche avec tag

    // Vérifier que le CSV contient la date limite
    expect(csvContent).toContain('2025-07-10')

    // Vérifier que le CSV contient le lien
    expect(csvContent).toContain('https://example.com/important')

    console.log('✅ Contenu CSV validé !')
  })

  test('should reject export without authentication', async () => {
    console.log("\n🔄 Test d'export CSV sans authentification...")

    const exportResponse = await request(server)
      .get('/api/tasks/export')
      .expect(401)

    console.log('✅ Export rejeté sans authentification comme attendu')
    expect(exportResponse.body.error).toBe(
      'Authorization header with Bearer token is required'
    )
  })

  test('should export empty CSV when user has no tasks', async () => {
    console.log("\n🔄 Test d'export CSV avec utilisateur sans tâches...")

    // Créer un nouvel utilisateur sans tâches
    const emptyUserEmail = `test-empty-user-${Date.now()}@example.com`
    const emptyUserPassword = 'test-password-456'

    const emptyUser = await authService.register(
      emptyUserEmail,
      emptyUserPassword
    )
    const emptyUserAuth = await authService.login(
      emptyUserEmail,
      emptyUserPassword
    )

    const exportResponse = await request(server)
      .get('/api/tasks/export')
      .set('Authorization', `Bearer ${emptyUserAuth.token}`)
      .expect(200)

    const csvContent = exportResponse.text
    console.log('📄 CSV pour utilisateur vide:')
    console.log(csvContent)

    // Vérifier que le CSV ne contient que l'en-tête
    const lines = csvContent.split('\n').filter((line) => line.trim())
    expect(lines).toHaveLength(1) // Seulement l'en-tête
    expect(lines[0]).toBe(
      'ID,Nom,Lien,Note,Importance,Complexité,Points,Date prévue,Date limite,Date de création,Date de modification,Tâche parente,Nom tâche parente,Tags'
    )

    console.log('✅ Export CSV vide validé !')

    // Nettoyer l'utilisateur de test
    await prisma.user.delete({
      where: { email: emptyUserEmail }
    })
  })
})
