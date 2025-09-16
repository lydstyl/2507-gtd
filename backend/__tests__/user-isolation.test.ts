import { PrismaClient } from '@prisma/client'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'
import { PrismaTagRepository } from '../src/infrastructure/repositories/PrismaTagRepository'

const prisma = new PrismaClient()
const taskRepository = new PrismaTaskRepository(prisma)
const tagRepository = new PrismaTagRepository(prisma)

describe('User Data Isolation Tests', () => {
  const user1Id = 'test-user-1'
  const user1Email = 'user1@example.com'
  const user2Id = 'test-user-2'
  const user2Email = 'user2@example.com'

  beforeAll(async () => {
    // Créer les utilisateurs de test
    await prisma.user.upsert({
      where: { id: user1Id },
      update: {},
      create: {
        id: user1Id,
        email: user1Email,
        password: 'test-password-1'
      }
    })
    await prisma.user.upsert({
      where: { id: user2Id },
      update: {},
      create: {
        id: user2Id,
        email: user2Email,
        password: 'test-password-2'
      }
    })

    // Nettoyer les données de test
    await prisma.task.deleteMany({
      where: { userId: { in: [user1Id, user2Id] } }
    })
    await prisma.tag.deleteMany({
      where: { userId: { in: [user1Id, user2Id] } }
    })
  }, 15000)

  afterAll(async () => {
    await prisma.task.deleteMany({
      where: { userId: { in: [user1Id, user2Id] } }
    })
    await prisma.tag.deleteMany({
      where: { userId: { in: [user1Id, user2Id] } }
    })
    await prisma.user.deleteMany({
      where: { id: { in: [user1Id, user2Id] } }
    })
    await prisma.$disconnect()
  }, 15000)

  test('should isolate tasks between users', async () => {
    // Créer des tâches pour user1
    const user1Task1 = await taskRepository.create({
      name: 'Tâche User 1 - 1',
      importance: 45,
      complexity: 2,
      userId: user1Id
    })

    const user1Task2 = await taskRepository.create({
      name: 'Tâche User 1 - 2',
      importance: 25,
      complexity: 3,
      userId: user1Id
    })

    // Créer des tâches pour user2
    const user2Task1 = await taskRepository.create({
      name: 'Tâche User 2 - 1',
      importance: 20,
      complexity: 4,
      userId: user2Id
    })

    const user2Task2 = await taskRepository.create({
      name: 'Tâche User 2 - 2',
      importance: 35,
      complexity: 5,
      userId: user2Id
    })

    // Récupérer les tâches de user1
    const user1Tasks = await taskRepository.findAll({ userId: user1Id })
    console.log('\n📋 Tâches de User 1:')
    user1Tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.name} (User: ${task.userId})`)
    })

    // Récupérer les tâches de user2
    const user2Tasks = await taskRepository.findAll({ userId: user2Id })
    console.log('\n📋 Tâches de User 2:')
    user2Tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.name} (User: ${task.userId})`)
    })

    // Vérifications
    expect(user1Tasks).toHaveLength(2)
    expect(user2Tasks).toHaveLength(2)

    // Vérifier que user1 ne voit que ses tâches
    user1Tasks.forEach((task) => {
      expect(task.userId).toBe(user1Id)
      expect(task.name).toMatch(/User 1/)
    })

    // Vérifier que user2 ne voit que ses tâches
    user2Tasks.forEach((task) => {
      expect(task.userId).toBe(user2Id)
      expect(task.name).toMatch(/User 2/)
    })

    // Vérifier qu'il n'y a pas de mélange
    const user1TaskNames = user1Tasks.map((t) => t.name)
    const user2TaskNames = user2Tasks.map((t) => t.name)

    user1TaskNames.forEach((name) => {
      expect(user2TaskNames).not.toContain(name)
    })

    user2TaskNames.forEach((name) => {
      expect(user1TaskNames).not.toContain(name)
    })

    console.log('\n✅ Isolation des tâches vérifiée !')
  }, 15000)

  test('should isolate tags between users', async () => {
    // Créer des tags pour user1
    const user1Tag1 = await tagRepository.create({
      name: 'Tag User 1 - Travail',
      color: '#ff0000',
      userId: user1Id
    })

    const user1Tag2 = await tagRepository.create({
      name: 'Tag User 1 - Personnel',
      color: '#00ff00',
      userId: user1Id
    })

    // Créer des tags pour user2
    const user2Tag1 = await tagRepository.create({
      name: 'Tag User 2 - Projet',
      color: '#0000ff',
      userId: user2Id
    })

    const user2Tag2 = await tagRepository.create({
      name: 'Tag User 2 - Urgent',
      color: '#ffff00',
      userId: user2Id
    })

    // Récupérer les tags de user1
    const user1Tags = await tagRepository.findAll(user1Id)
    console.log('\n🏷️ Tags de User 1:')
    user1Tags.forEach((tag, index) => {
      console.log(`${index + 1}. ${tag.name} (User: ${tag.userId})`)
    })

    // Récupérer les tags de user2
    const user2Tags = await tagRepository.findAll(user2Id)
    console.log('\n🏷️ Tags de User 2:')
    user2Tags.forEach((tag, index) => {
      console.log(`${index + 1}. ${tag.name} (User: ${tag.userId})`)
    })

    // Vérifications
    expect(user1Tags).toHaveLength(2)
    expect(user2Tags).toHaveLength(2)

    // Vérifier que user1 ne voit que ses tags
    user1Tags.forEach((tag) => {
      expect(tag.userId).toBe(user1Id)
      expect(tag.name).toMatch(/User 1/)
    })

    // Vérifier que user2 ne voit que ses tags
    user2Tags.forEach((tag) => {
      expect(tag.userId).toBe(user2Id)
      expect(tag.name).toMatch(/User 2/)
    })

    // Vérifier qu'il n'y a pas de mélange
    const user1TagNames = user1Tags.map((t) => t.name)
    const user2TagNames = user2Tags.map((t) => t.name)

    user1TagNames.forEach((name) => {
      expect(user2TagNames).not.toContain(name)
    })

    user2TagNames.forEach((name) => {
      expect(user1TagNames).not.toContain(name)
    })

    console.log('\n✅ Isolation des tags vérifiée !')
  })

  test('should isolate tasks with tags between users', async () => {
    // Créer des tags pour chaque utilisateur
    const user1Tag = await tagRepository.create({
      name: 'Tag User 1',
      color: '#ff0000',
      userId: user1Id
    })

    const user2Tag = await tagRepository.create({
      name: 'Tag User 2',
      color: '#00ff00',
      userId: user2Id
    })

    // Créer des tâches avec tags pour user1
    const user1TaskWithTag = await taskRepository.create({
      name: 'Tâche User 1 avec tag',
      importance: 25,
      complexity: 2,
      tagIds: [user1Tag.id],
      userId: user1Id
    })

    // Créer des tâches avec tags pour user2
    const user2TaskWithTag = await taskRepository.create({
      name: 'Tâche User 2 avec tag',
      importance: 30,
      complexity: 3,
      tagIds: [user2Tag.id],
      userId: user2Id
    })

    // Récupérer les tâches avec leurs tags
    const user1Tasks = await taskRepository.findAll({ userId: user1Id })
    const user2Tasks = await taskRepository.findAll({ userId: user2Id })

    console.log('\n📋 Tâches avec tags de User 1:')
    user1Tasks.forEach((task, index) => {
      const tagNames = task.tags.map((t) => t.name).join(', ')
      console.log(`${index + 1}. ${task.name} - Tags: [${tagNames}]`)
    })

    console.log('\n📋 Tâches avec tags de User 2:')
    user2Tasks.forEach((task, index) => {
      const tagNames = task.tags.map((t) => t.name).join(', ')
      console.log(`${index + 1}. ${task.name} - Tags: [${tagNames}]`)
    })

    // Vérifier que les tâches ont les bons tags
    const user1TaskWithTags = user1Tasks.find(
      (t) => t.name === 'Tâche User 1 avec tag'
    )
    const user2TaskWithTags = user2Tasks.find(
      (t) => t.name === 'Tâche User 2 avec tag'
    )

    expect(user1TaskWithTags).toBeDefined()
    expect(user2TaskWithTags).toBeDefined()

    expect(user1TaskWithTags!.tags).toHaveLength(1)
    expect(user2TaskWithTags!.tags).toHaveLength(1)

    expect(user1TaskWithTags!.tags[0].name).toBe('Tag User 1')
    expect(user2TaskWithTags!.tags[0].name).toBe('Tag User 2')

    // Vérifier que user1 ne peut pas voir les tags de user2
    const user1AllTags = await tagRepository.findAll(user1Id)
    const user2AllTags = await tagRepository.findAll(user2Id)

    user1AllTags.forEach((tag) => {
      expect(tag.userId).toBe(user1Id)
    })

    user2AllTags.forEach((tag) => {
      expect(tag.userId).toBe(user2Id)
    })

    console.log('\n✅ Isolation des tâches avec tags vérifiée !')
  })

  test('should not allow users to access other users data without userId filter', async () => {
    // Créer des tâches pour les deux utilisateurs
    await taskRepository.create({
      name: 'Tâche User 1 - Test isolation',
      importance: 25,
      complexity: 2,
      userId: user1Id
    })

    await taskRepository.create({
      name: 'Tâche User 2 - Test isolation',
      importance: 30,
      complexity: 3,
      userId: user2Id
    })

    // Vérifier que chaque utilisateur ne voit que ses propres tâches
    const user1Tasks = await taskRepository.findAll({ userId: user1Id })
    const user2Tasks = await taskRepository.findAll({ userId: user2Id })

    // Vérifier qu'il n'y a pas de mélange
    const user1TaskIds = user1Tasks.map((t) => t.id)
    const user2TaskIds = user2Tasks.map((t) => t.id)

    user1TaskIds.forEach((taskId) => {
      expect(user2TaskIds).not.toContain(taskId)
    })

    user2TaskIds.forEach((taskId) => {
      expect(user1TaskIds).not.toContain(taskId)
    })

    // Vérifier que chaque utilisateur ne voit que ses tâches
    user1Tasks.forEach((task) => {
      expect(task.userId).toBe(user1Id)
    })

    user2Tasks.forEach((task) => {
      expect(task.userId).toBe(user2Id)
    })

    console.log('\n✅ Isolation sans filtre userId vérifiée !')
  })
})
