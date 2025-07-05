import { PrismaClient } from '@prisma/client'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'

const prisma = new PrismaClient()
const taskRepository = new PrismaTaskRepository(prisma)

describe('Overdue Task Sorting Tests', () => {
  const userId = 'test-user-sorting-overdue'
  const userEmail = 'test-sorting-overdue@example.com'

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

  test('should sort overdue tasks before today tasks but after quick tasks', async () => {
    // Créer des tâches de test avec différentes caractéristiques
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    
    const testTasks = [
      // 1. Tâches rapides (sans importance/urgence/priorité définies)
      { name: 'Tâche rapide 1', importance: 5, urgency: 5, priority: 5, dueDate: null },
      { name: 'Tâche rapide 2', importance: 5, urgency: 5, priority: 5, dueDate: null },
      
      // 2. Tâches en retard (dates passées)
      { name: 'Tâche en retard - hier', importance: 3, urgency: 2, priority: 1, dueDate: yesterday },
      { name: 'Tâche en retard - il y a 2 jours', importance: 1, urgency: 1, priority: 1, dueDate: twoDaysAgo },
      
      // 3. Tâches pour aujourd'hui
      { name: 'Tâche aujourd\'hui - Urgente', importance: 3, urgency: 1, priority: 2, dueDate: today },
      { name: 'Tâche aujourd\'hui - Importante', importance: 1, urgency: 3, priority: 2, dueDate: today },
      
      // 4. Tâches avec priorités définies (sans date)
      { name: 'Tâche importante - sans date', importance: 1, urgency: 5, priority: 4 },
      { name: 'Tâche urgente - sans date', importance: 5, urgency: 1, priority: 4 },
      
      // 5. Tâches rapides avec dates éloignées
      { name: 'Tâche rapide - dans 5 jours', importance: 5, urgency: 5, priority: 5, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
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
    console.log('\n📋 Tâches triées (test en retard):')
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

    // 2. Vérifier que les tâches en retard sont groupées
    const overdueTasks = allTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < today
    )
    expect(overdueTasks.length).toBeGreaterThan(0)

    // 3. Vérifier que les tâches d'aujourd'hui sont groupées
    const todayTasks = allTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate).toDateString() === today.toDateString()
    )
    expect(todayTasks.length).toBeGreaterThan(0)

    // 4. Vérifier l'ordre : rapides -> en retard -> aujourd'hui
    const quickTasks = allTasks.filter(task => 
      task.importance === 5 && task.urgency === 5 && task.priority === 5 && !task.dueDate
    )
    
    // Trouver les indices
    const lastQuickTaskIndex = Math.max(...quickTasks.map(t => allTasks.indexOf(t)))
    const firstOverdueTaskIndex = Math.min(...overdueTasks.map(t => allTasks.indexOf(t)))
    const lastOverdueTaskIndex = Math.max(...overdueTasks.map(t => allTasks.indexOf(t)))
    const firstTodayTaskIndex = Math.min(...todayTasks.map(t => allTasks.indexOf(t)))

    // Vérifier l'ordre
    expect(lastQuickTaskIndex).toBeLessThan(firstOverdueTaskIndex)
    expect(lastOverdueTaskIndex).toBeLessThan(firstTodayTaskIndex)

    // 5. Vérifier que les tâches en retard sont triées par importance, urgence, priorité
    const overdueTasksInOrder = allTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < today
    )
    
    // Vérifier que les tâches en retard sont triées par priorité (importance croissante)
    for (let i = 0; i < overdueTasksInOrder.length - 1; i++) {
      const current = overdueTasksInOrder[i]
      const next = overdueTasksInOrder[i + 1]
      
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

    console.log('\n✅ Test de tri avec tâches en retard réussi !')
  })
}) 