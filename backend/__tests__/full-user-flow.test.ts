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

describe('Full User Flow Tests', () => {
  const testEmail = 'test-user-flow@example.com'
  const testPassword = 'test-password-123'
  let userId: string
  let authToken: string

  beforeAll(async () => {
    // Nettoyer les données de test existantes
    await prisma.task.deleteMany({
      where: { user: { email: testEmail } }
    })
    await prisma.tag.deleteMany({
      where: { user: { email: testEmail } }
    })
    await prisma.user.deleteMany({
      where: { email: testEmail }
    })
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
  }, 15000)

  test('should create user, authenticate, create task and retrieve it', async () => {
    console.log('\n🔄 Test du flux utilisateur complet...')

    // 1. Créer un utilisateur
    const userEmail = `test-user-${Date.now()}@example.com`
    const userPassword = 'test-password-123'

    console.log("📝 1. Création de l'utilisateur...")
    const { user } = await authService.register(userEmail, userPassword)
    console.log('✅ Utilisateur créé:', user.id)

    // 2. Authentifier l'utilisateur
    console.log('🔐 2. Authentification...')
    const authResult = await authService.login(userEmail, userPassword)
    console.log('✅ Authentification réussie')

    // 3. Créer une tâche
    console.log("📋 3. Création d'une tâche...")
    const task = await taskRepository.create({
      name: 'Tâche de test',
      importance: 30,
      complexity: 2,
      userId: user.id
    })
    console.log('✅ Tâche créée:', task.id)

    // 4. Récupérer la tâche
    console.log('🔍 4. Récupération de la tâche...')
    const retrievedTask = await taskRepository.findById(task.id)
    if (!retrievedTask) {
      throw new Error('Task not found')
    }
    console.log('✅ Tâche récupérée:', retrievedTask.name)

    // Vérifications
    expect(retrievedTask).toBeDefined()
    expect(retrievedTask.name).toBe('Tâche de test')
    expect(retrievedTask.userId).toBe(user.id)

    console.log('✅ Test du flux utilisateur complet réussi !')
  }, 15000)

  test('should verify user isolation - another user cannot see first user data', async () => {
    console.log("\n🔄 Test d'isolation des utilisateurs...")

    // Créer un premier utilisateur pour ce test
    const firstUserEmail = `test-user-1-${Date.now()}@example.com`
    const firstUserPassword = 'test-password-123'

    console.log('📝 Création du premier utilisateur...')
    const { user: firstUser } = await authService.register(
      firstUserEmail,
      firstUserPassword
    )
    console.log('✅ Premier utilisateur créé:', firstUser.id)

    // Créer une tâche pour le premier utilisateur
    console.log("📋 Création d'une tâche pour le premier utilisateur...")
    const firstUserTask = await taskRepository.create({
      name: 'Tâche du premier utilisateur',
      importance: 25,
      complexity: 3,
      userId: firstUser.id
    })
    console.log('✅ Tâche du premier utilisateur créée')

    // Créer un deuxième utilisateur avec un email unique
    const secondUserEmail = `test-user-2-${Date.now()}@example.com`
    const secondUserPassword = 'test-password-456'

    console.log('📝 Création du deuxième utilisateur...')
    const { user: secondUser } = await authService.register(
      secondUserEmail,
      secondUserPassword
    )
    console.log('✅ Deuxième utilisateur créé:', {
      id: secondUser.id,
      email: secondUser.email
    })

    // Créer une tâche pour le deuxième utilisateur
    console.log("📋 Création d'une tâche pour le deuxième utilisateur...")
    const secondUserTask = await taskRepository.create({
      name: 'Tâche du deuxième utilisateur',
      importance: 35,
      complexity: 4,
      userId: secondUser.id
    })
    console.log('✅ Tâche du deuxième utilisateur créée')

    // Vérifier que chaque utilisateur ne voit que ses propres tâches
    console.log("🔍 Vérification de l'isolation...")
    const firstUserTasks = await taskRepository.findAll({
      userId: firstUser.id
    })
    const secondUserTasks = await taskRepository.findAll({
      userId: secondUser.id
    })

    console.log('📊 Résultats:')
    console.log(`- Premier utilisateur: ${firstUserTasks.length} tâches`)
    console.log(`- Deuxième utilisateur: ${secondUserTasks.length} tâches`)

    // Vérifications
    expect(firstUserTasks.length).toBeGreaterThan(0)
    expect(secondUserTasks.length).toBeGreaterThan(0)

    // Vérifier qu'il n'y a pas de mélange
    const firstUserTaskIds = firstUserTasks.map((t) => t.id)
    const secondUserTaskIds = secondUserTasks.map((t) => t.id)

    firstUserTaskIds.forEach((taskId) => {
      expect(secondUserTaskIds).not.toContain(taskId)
    })

    secondUserTaskIds.forEach((taskId) => {
      expect(firstUserTaskIds).not.toContain(taskId)
    })

    // Vérifier que chaque utilisateur ne voit que ses tâches
    firstUserTasks.forEach((task) => {
      expect(task.userId).toBe(firstUser.id)
    })

    secondUserTasks.forEach((task) => {
      expect(task.userId).toBe(secondUser.id)
    })

    console.log('✅ Isolation des utilisateurs vérifiée !')

    // Nettoyer les utilisateurs de test
    await prisma.task.deleteMany({
      where: { userId: { in: [firstUser.id, secondUser.id] } }
    })
    await prisma.user.deleteMany({
      where: { id: { in: [firstUser.id, secondUser.id] } }
    })
  }, 15000)
})
