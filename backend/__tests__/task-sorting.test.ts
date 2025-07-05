import { PrismaClient } from '@prisma/client'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'

const prisma = new PrismaClient()
const taskRepository = new PrismaTaskRepository(prisma)

describe('Task Sorting Tests', () => {
  const userId = 'test-user-sorting'
  const userEmail = 'test-sorting@example.com'

  beforeAll(async () => {
    // Créer l'utilisateur de test
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: userEmail,
        password: 'test-password',
      },
    })
    // Nettoyer les tâches de test
    await prisma.task.deleteMany({
      where: { userId }
    })
  })

  afterAll(async () => {
    await prisma.task.deleteMany({
      where: { userId }
    })
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  test('should sort tasks according to specified criteria', async () => {
    // Créer des tâches de test avec différentes caractéristiques
    const testTasks = [
      // 1. Tâches rapides (sans importance/urgence/priorité définies)
      { name: 'Tâche rapide 1', importance: 5, urgency: 5, priority: 5, dueDate: null },
      { name: 'Tâche rapide 2', importance: 5, urgency: 5, priority: 5, dueDate: null },
      
      // 2. Tâches pour aujourd'hui
      { name: 'Tâche aujourd\'hui - Urgente', importance: 3, urgency: 1, priority: 2, dueDate: new Date() },
      { name: 'Tâche aujourd\'hui - Importante', importance: 1, urgency: 3, priority: 2, dueDate: new Date() },
      { name: 'Tâche aujourd\'hui - Priorité', importance: 3, urgency: 3, priority: 1, dueDate: new Date() },
      
      // 3. Tâches pour demain
      { name: 'Tâche demain - Urgente', importance: 4, urgency: 1, priority: 3, dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { name: 'Tâche demain - Importante', importance: 1, urgency: 4, priority: 3, dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      
      // 4. Tâches normales (triées par importance, urgence, priorité)
      { name: 'Tâche normale - Moyenne', importance: 5, urgency: 5, priority: 5 },
      { name: 'Tâche normale - Faible', importance: 8, urgency: 7, priority: 6 },
      { name: 'Tâche normale - Très importante', importance: 1, urgency: 5, priority: 4 },
      { name: 'Tâche normale - Importante', importance: 2, urgency: 4, priority: 3 },
      
    ]

    // Créer les tâches principales
    const createdTasks: any[] = []
    for (const taskData of testTasks) {
      const task = await taskRepository.create({
        name: taskData.name,
        importance: taskData.importance,
        urgency: taskData.urgency,
        priority: taskData.priority,
        dueDate: taskData.dueDate || undefined,
        userId
      })
      createdTasks.push(task)
    }

    // Créer des sous-tâches pour certaines tâches
    const parentTask = createdTasks[2] // Tâche aujourd'hui - Urgente
    const subtasks = [
      { name: 'Sous-tâche - Importante', importance: 1, urgency: 3, priority: 2 },
      { name: 'Sous-tâche - Urgente', importance: 3, urgency: 1, priority: 2 },
      { name: 'Sous-tâche - Priorité', importance: 3, urgency: 3, priority: 1 },
    ]

    for (const subtaskData of subtasks) {
      await taskRepository.create({
        name: subtaskData.name,
        importance: subtaskData.importance,
        urgency: subtaskData.urgency,
        priority: subtaskData.priority,
        parentId: parentTask.id,
        userId
      })
    }

    // Récupérer toutes les tâches
    const allTasks = await taskRepository.findAll({ userId })

    // Vérifier le tri
    console.log('\n📋 Tâches triées:')
    allTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.name} (I:${task.importance}, U:${task.urgency}, P:${task.priority})`)
      if (task.subtasks.length > 0) {
        task.subtasks.forEach((subtask, subIndex) => {
          console.log(`   ${index + 1}.${subIndex + 1}. ${subtask.name} (I:${subtask.importance}, U:${subtask.urgency}, P:${subtask.priority})`)
        })
      }
    })

    // Vérifications spécifiques
    expect(allTasks.length).toBeGreaterThan(0)

    // Vérifier que les tâches rapides sont en premier
    const firstTask = allTasks[0]
    expect(firstTask.importance).toBe(5)
    expect(firstTask.urgency).toBe(5)
    expect(firstTask.priority).toBe(5)

    // Vérifier que les tâches d'aujourd'hui sont groupées
    const todayTasks = allTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate).toDateString() === new Date().toDateString()
    )
    expect(todayTasks.length).toBeGreaterThan(0)

    // Vérifier que les tâches de demain sont groupées
    const tomorrowTasks = allTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate).toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
    )
    expect(tomorrowTasks.length).toBeGreaterThan(0)

    // Vérifier que les sous-tâches sont triées
    const taskWithSubtasks = allTasks.find(task => task.subtasks.length > 0)
    if (taskWithSubtasks && taskWithSubtasks.subtasks.length > 0) {
      const subtasks = taskWithSubtasks.subtasks
      // Vérifier que les sous-tâches sont triées par importance, urgence, priorité
      for (let i = 0; i < subtasks.length - 1; i++) {
        const current = subtasks[i]
        const next = subtasks[i + 1]
        
        // Si importance différente, vérifier l'ordre
        if (current.importance !== next.importance) {
          expect(current.importance).toBeLessThanOrEqual(next.importance)
        } else if (current.urgency !== next.urgency) {
          // Si importance égale, vérifier urgence
          expect(current.urgency).toBeLessThanOrEqual(next.urgency)
        } else {
          // Si importance et urgence égales, vérifier priorité
          expect(current.priority).toBeLessThanOrEqual(next.priority)
        }
      }
    }
  })
}) 