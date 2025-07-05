import { PrismaClient } from '@prisma/client'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'

const prisma = new PrismaClient()
const taskRepository = new PrismaTaskRepository(prisma)

async function insertTestTasks() {
  const userId = 'user-id' // Utiliser le même userId que l'utilisateur connecté
  const userEmail = 'user@example.com'

  try {
    // Créer l'utilisateur s'il n'existe pas
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: userEmail,
        password: 'test-password',
      },
    })

    // Nettoyer les tâches existantes
    await prisma.task.deleteMany({
      where: { userId }
    })

    console.log('🧹 Tâches existantes supprimées')

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
      { name: 'Tâche normale - Très importante', importance: 1, urgency: 5, priority: 4 },
      { name: 'Tâche normale - Importante', importance: 2, urgency: 4, priority: 3 },
      { name: 'Tâche normale - Moyenne', importance: 5, urgency: 5, priority: 5 },
      { name: 'Tâche normale - Faible', importance: 8, urgency: 7, priority: 6 },
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
      console.log(`✅ Tâche créée: ${task.name}`)
    }

    // Créer des sous-tâches pour certaines tâches
    const parentTask = createdTasks[2] // Tâche aujourd'hui - Urgente
    const subtasks = [
      { name: 'Sous-tâche - Importante', importance: 1, urgency: 3, priority: 2 },
      { name: 'Sous-tâche - Urgente', importance: 3, urgency: 1, priority: 2 },
      { name: 'Sous-tâche - Priorité', importance: 3, urgency: 3, priority: 1 },
    ]

    for (const subtaskData of subtasks) {
      const subtask = await taskRepository.create({
        name: subtaskData.name,
        importance: subtaskData.importance,
        urgency: subtaskData.urgency,
        priority: subtaskData.priority,
        parentId: parentTask.id,
        userId
      })
      console.log(`✅ Sous-tâche créée: ${subtask.name}`)
    }

    // Récupérer toutes les tâches pour vérifier le tri
    const allTasks = await taskRepository.findAll({ userId })

    console.log('\n📋 Tâches triées:')
    allTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.name} (I:${task.importance}, U:${task.urgency}, P:${task.priority})`)
      if (task.subtasks.length > 0) {
        task.subtasks.forEach((subtask, subIndex) => {
          console.log(`   ${index + 1}.${subIndex + 1}. ${subtask.name} (I:${subtask.importance}, U:${subtask.urgency}, P:${subtask.priority})`)
        })
      }
    })

    console.log('\n🎉 Tâches de test insérées avec succès !')
    console.log('Vous pouvez maintenant voir ces tâches sur le frontend.')

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des tâches:', error)
  } finally {
    await prisma.$disconnect()
  }
}

insertTestTasks() 