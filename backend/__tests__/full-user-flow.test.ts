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
  })

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
  })

  test('should create user, authenticate, create task and retrieve it', async () => {
    console.log('\n🔄 Test du flux utilisateur complet...')

    // 1. Créer un utilisateur
    console.log('📝 1. Création de l\'utilisateur...')
    const user = await authService.register(testEmail, testPassword)
    userId = user.id
    console.log('✅ Utilisateur créé:', { id: user.id, email: user.email })

    // Vérifier que l'utilisateur existe dans la base
    const createdUser = await userRepository.findByEmail(testEmail)
    expect(createdUser).toBeDefined()
    expect(createdUser!.id).toBe(userId)
    expect(createdUser!.email).toBe(testEmail)

    // 2. Authentifier l'utilisateur
    console.log('🔐 2. Authentification...')
    const authResult = await authService.login(testEmail, testPassword)
    authToken = authResult.token
    console.log('✅ Authentification réussie, token obtenu')

    // Vérifier que le token contient les bonnes informations
    const jwt = require('jsonwebtoken')
    const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET || 'dev-secret')
    expect(decodedToken.userId).toBe(userId)
    expect(decodedToken.email).toBe(testEmail)

    // 3. Créer une tâche
    console.log('📋 3. Création d\'une tâche...')
    const taskData = {
      name: 'Tâche de test du flux complet',
      importance: 1,
      urgency: 2,
      priority: 3,
      link: 'https://example.com',
      userId: userId
    }

    const createdTask = await taskRepository.create(taskData)
    console.log('✅ Tâche créée:', { id: createdTask.id, name: createdTask.name })

    // Vérifier que la tâche a été créée correctement
    expect(createdTask).toBeDefined()
    expect(createdTask.name).toBe(taskData.name)
    expect(createdTask.importance).toBe(taskData.importance)
    expect(createdTask.urgency).toBe(taskData.urgency)
    expect(createdTask.priority).toBe(taskData.priority)
    expect(createdTask.userId).toBe(userId)
    expect(createdTask.link).toBe(taskData.link)

    // 4. Récupérer les tâches de l'utilisateur
    console.log('🔍 4. Récupération des tâches...')
    const userTasks = await taskRepository.findAll({ userId })
    console.log('✅ Tâches récupérées:', userTasks.length)

    // Vérifier que la tâche est bien récupérée
    expect(userTasks).toHaveLength(1)
    expect(userTasks[0].id).toBe(createdTask.id)
    expect(userTasks[0].name).toBe(taskData.name)
    expect(userTasks[0].userId).toBe(userId)

    // 5. Créer un tag
    console.log('🏷️ 5. Création d\'un tag...')
    const tagData = {
      name: 'Tag de test',
      color: '#ff0000',
      userId: userId
    }

    const createdTag = await tagRepository.create(tagData)
    console.log('✅ Tag créé:', { id: createdTag.id, name: createdTag.name })

    // Vérifier que le tag a été créé correctement
    expect(createdTag).toBeDefined()
    expect(createdTag.name).toBe(tagData.name)
    expect(createdTag.color).toBe(tagData.color)
    expect(createdTag.userId).toBe(userId)

    // 6. Créer une tâche avec le tag
    console.log('📋 6. Création d\'une tâche avec tag...')
    const taskWithTagData = {
      name: 'Tâche avec tag',
      importance: 2,
      urgency: 1,
      priority: 2,
      userId: userId,
      tagIds: [createdTag.id]
    }

    const taskWithTag = await taskRepository.create(taskWithTagData)
    console.log('✅ Tâche avec tag créée:', { id: taskWithTag.id, name: taskWithTag.name })

    // Vérifier que la tâche a le bon tag
    expect(taskWithTag.tags).toHaveLength(1)
    expect(taskWithTag.tags[0].id).toBe(createdTag.id)
    expect(taskWithTag.tags[0].name).toBe(createdTag.name)

    // 7. Récupérer toutes les tâches de l'utilisateur
    console.log('🔍 7. Récupération de toutes les tâches...')
    const allUserTasks = await taskRepository.findAll({ userId })
    console.log('✅ Toutes les tâches récupérées:', allUserTasks.length)

    // Vérifier qu'on a bien 2 tâches
    expect(allUserTasks).toHaveLength(2)
    
    // Vérifier que les tâches appartiennent bien à l'utilisateur
    allUserTasks.forEach(task => {
      expect(task.userId).toBe(userId)
    })

    // 8. Récupérer les tags de l'utilisateur
    console.log('🏷️ 8. Récupération des tags...')
    const userTags = await tagRepository.findAll(userId)
    console.log('✅ Tags récupérés:', userTags.length)

    // Vérifier qu'on a bien 1 tag
    expect(userTags).toHaveLength(1)
    expect(userTags[0].id).toBe(createdTag.id)
    expect(userTags[0].name).toBe(createdTag.name)
    expect(userTags[0].userId).toBe(userId)

    console.log('\n🎉 Test du flux utilisateur complet réussi !')
  })

  test('should verify user isolation - another user cannot see first user data', async () => {
    console.log('\n🔄 Test d\'isolation des utilisateurs...')

    // Créer un deuxième utilisateur
    const secondUserEmail = 'test-user-2@example.com'
    const secondUserPassword = 'test-password-456'

    console.log('📝 Création du deuxième utilisateur...')
    const secondUser = await authService.register(secondUserEmail, secondUserPassword)
    console.log('✅ Deuxième utilisateur créé:', { id: secondUser.id, email: secondUser.email })

    // Créer une tâche pour le deuxième utilisateur
    console.log('📋 Création d\'une tâche pour le deuxième utilisateur...')
    const secondUserTask = await taskRepository.create({
      name: 'Tâche du deuxième utilisateur',
      importance: 3,
      urgency: 4,
      priority: 5,
      userId: secondUser.id
    })
    console.log('✅ Tâche du deuxième utilisateur créée')

    // Vérifier que le premier utilisateur ne voit que ses propres tâches
    console.log('🔍 Vérification de l\'isolation...')
    const firstUserTasks = await taskRepository.findAll({ userId })
    const secondUserTasks = await taskRepository.findAll({ userId: secondUser.id })

    console.log('📊 Résultats:')
    console.log(`- Premier utilisateur: ${firstUserTasks.length} tâches`)
    console.log(`- Deuxième utilisateur: ${secondUserTasks.length} tâches`)

    // Vérifications
    expect(firstUserTasks.length).toBeGreaterThan(0)
    expect(secondUserTasks.length).toBeGreaterThan(0)

    // Vérifier qu'il n'y a pas de mélange
    const firstUserTaskIds = firstUserTasks.map(t => t.id)
    const secondUserTaskIds = secondUserTasks.map(t => t.id)

    firstUserTaskIds.forEach(taskId => {
      expect(secondUserTaskIds).not.toContain(taskId)
    })

    secondUserTaskIds.forEach(taskId => {
      expect(firstUserTaskIds).not.toContain(taskId)
    })

    // Vérifier que chaque utilisateur ne voit que ses tâches
    firstUserTasks.forEach(task => {
      expect(task.userId).toBe(userId)
    })

    secondUserTasks.forEach(task => {
      expect(task.userId).toBe(secondUser.id)
    })

    console.log('✅ Isolation des utilisateurs vérifiée !')

    // Nettoyer le deuxième utilisateur
    await prisma.task.deleteMany({
      where: { userId: secondUser.id }
    })
    await prisma.user.delete({
      where: { id: secondUser.id }
    })
  })
}) 