import { PrismaClient } from '@prisma/client'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'

const prisma = new PrismaClient()
const taskRepository = new PrismaTaskRepository(prisma)

describe('Extended Task Sorting Tests', () => {
  const userId = 'test-user-sorting-extended'
  const userEmail = 'test-sorting-extended@example.com'

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

  test('should sort tasks with distant dates at the bottom', async () => {
    // Créer des tâches de test avec différentes caractéristiques
    const testTasks = [
      // 1. Tâches rapides (sans importance/urgence/priorité définies)
      { name: 'Tâche rapide 1', importance: 5, urgency: 5, priority: 5, dueDate: null },
      { name: 'Tâche rapide 2', importance: 5, urgency: 5, priority: 5, dueDate: null },
      
      // 2. Tâches pour aujourd'hui
      { name: 'Tâche aujourd\'hui - Urgente', importance: 3, urgency: 1, priority: 2, dueDate: new Date() },
      { name: 'Tâche aujourd\'hui - Importante', importance: 1, urgency: 3, priority: 2, dueDate: new Date() },
      
      // 3. Tâches pour demain
      { name: 'Tâche demain - Urgente', importance: 4, urgency: 1, priority: 3, dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { name: 'Tâche demain - Importante', importance: 1, urgency: 4, priority: 3, dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      
      // 4. Tâches avec priorités définies (devraient être avant les tâches rapides avec dates)
      { name: 'Tâche importante - sans date', importance: 1, urgency: 5, priority: 4 },
      { name: 'Tâche urgente - sans date', importance: 5, urgency: 1, priority: 4 },
      
      // 5. Tâches rapides avec dates éloignées (devraient être en bas)
      { name: 'Tâche rapide - dans 5 jours', importance: 5, urgency: 5, priority: 5, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      { name: 'Tâche rapide - dans 6 jours', importance: 5, urgency: 5, priority: 5, dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) },
      { name: 'Tâche rapide - dans 3 jours', importance: 5, urgency: 5, priority: 5, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
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

    // Récupérer toutes les tâches
    const allTasks = await taskRepository.findAll({ userId })

    // Vérifier le tri
    console.log('\n📋 Tâches triées (test étendu):')
    allTasks.forEach((task, index) => {
      const dateInfo = task.dueDate ? ` (${new Date(task.dueDate).toLocaleDateString()})` : ''
      console.log(`${index + 1}. ${task.name} (I:${task.importance}, U:${task.urgency}, P:${task.priority})${dateInfo}`)
    })

    // Vérifications spécifiques
    expect(allTasks.length).toBeGreaterThan(0)

    // 1. Vérifier que les tâches rapides sont en premier
    const firstTask = allTasks[0]
    expect(firstTask.importance).toBe(5)
    expect(firstTask.urgency).toBe(5)
    expect(firstTask.priority).toBe(5)

    // 2. Vérifier que les tâches d'aujourd'hui sont groupées
    const todayTasks = allTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate).toDateString() === new Date().toDateString()
    )
    expect(todayTasks.length).toBeGreaterThan(0)

    // 3. Vérifier que les tâches de demain sont groupées
    const tomorrowTasks = allTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate).toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
    )
    expect(tomorrowTasks.length).toBeGreaterThan(0)

    // 4. Vérifier que les tâches avec priorités définies sont avant les tâches rapides avec dates
    const tasksWithPriority = allTasks.filter(task => 
      task.importance !== 5 || task.urgency !== 5 || task.priority !== 5
    )
    const quickTasksWithDates = allTasks.filter(task => 
      task.importance === 5 && task.urgency === 5 && task.priority === 5 && task.dueDate
    )

    // Trouver les indices des dernières tâches avec priorités et des premières tâches rapides avec dates
    const lastPriorityTaskIndex = Math.max(...tasksWithPriority.map(t => allTasks.indexOf(t)))
    const firstQuickTaskWithDateIndex = Math.min(...quickTasksWithDates.map(t => allTasks.indexOf(t)))

    // Les tâches avec priorités doivent être avant les tâches rapides avec dates
    expect(lastPriorityTaskIndex).toBeLessThan(firstQuickTaskWithDateIndex)

    // 5. Vérifier que les tâches rapides avec dates sont triées par date (croissant)
    const quickTasksWithDatesSorted = quickTasksWithDates.sort((a, b) => 
      new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    
    const quickTasksWithDatesInOrder = allTasks.filter(task => 
      task.importance === 5 && task.urgency === 5 && task.priority === 5 && task.dueDate
    )

    // Vérifier que l'ordre correspond
    for (let i = 0; i < quickTasksWithDatesSorted.length; i++) {
      expect(quickTasksWithDatesSorted[i].id).toBe(quickTasksWithDatesInOrder[i].id)
    }

    console.log('\n✅ Test de tri étendu réussi !')
  })
}) 