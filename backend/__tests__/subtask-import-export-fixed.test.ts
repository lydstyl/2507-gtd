import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/services/authService'
import { PrismaUserRepository } from '../src/infrastructure/repositories/PrismaUserRepository'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'

const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)
const authService = new AuthService(userRepository)
const taskRepository = new PrismaTaskRepository(prisma)

describe('Subtask Import/Export Fixed Tests', () => {
  const userAEmail = 'user-a-fixed@example.com'
  const userBEmail = 'user-b-fixed@example.com'
  const testPassword = 'test-password-123'

  let userAId: string
  let userBId: string
  let userAAuthToken: string
  let userBAuthToken: string
  let server: any

  beforeAll(async () => {
    // Nettoyer les données de test existantes
    await prisma.task.deleteMany({
      where: {
        user: {
          email: { in: [userAEmail, userBEmail] }
        }
      }
    })
    await prisma.tag.deleteMany({
      where: {
        user: {
          email: { in: [userAEmail, userBEmail] }
        }
      }
    })
    await prisma.user.deleteMany({
      where: {
        email: { in: [userAEmail, userBEmail] }
      }
    })

    // Créer les utilisateurs de test
    const { user: userA } = await authService.register(userAEmail, testPassword)
    const { user: userB } = await authService.register(userBEmail, testPassword)
    userAId = userA.id
    userBId = userB.id

    const userAAuthResult = await authService.login(userAEmail, testPassword)
    const userBAuthResult = await authService.login(userBEmail, testPassword)
    userAAuthToken = userAAuthResult.token
    userBAuthToken = userBAuthResult.token

    server = app.listen(4006)
  }, 15000)

  afterAll(async () => {
    await prisma.task.deleteMany({
      where: {
        user: {
          email: { in: [userAEmail, userBEmail] }
        }
      }
    })
    await prisma.tag.deleteMany({
      where: {
        user: {
          email: { in: [userAEmail, userBEmail] }
        }
      }
    })
    await prisma.user.deleteMany({
      where: {
        email: { in: [userAEmail, userBEmail] }
      }
    })
    await prisma.$disconnect()
    if (server) server.close()
  }, 15000)

  test('should correctly import/export subtasks between users with parent name mapping', async () => {
    console.log(
      '🔍 Test: Import/export des sous-tâches corrigé entre utilisateurs'
    )

    // ÉTAPE 1: L'utilisateur A crée des tâches avec sous-tâches
    console.log(
      "\n📝 Étape 1: L'utilisateur A crée des tâches avec sous-tâches"
    )

    // Créer une tâche parente pour l'utilisateur A
    const parentTaskA = await taskRepository.create({
      name: 'Tâche parente pour import',
      importance: 35,
      complexity: 3,
      link: 'https://parent-task-import.com',
      userId: userAId
    })

    console.log('✅ Tâche parente créée:', parentTaskA.name)

    // Créer deux sous-tâches pour l'utilisateur A
    const subtask1A = await taskRepository.create({
      name: 'Sous-tâche 1 pour import',
      importance: 25,
      complexity: 2,
      parentId: parentTaskA.id,
      userId: userAId
    })

    const subtask2A = await taskRepository.create({
      name: 'Sous-tâche 2 pour import',
      importance: 20,
      complexity: 1,
      parentId: parentTaskA.id,
      userId: userAId
    })

    console.log('✅ Sous-tâches créées:', subtask1A.name, subtask2A.name)

    // Vérifier la structure pour l'utilisateur A
    const userATasks = await taskRepository.findAll({ userId: userAId })
    const parentTaskWithSubtasks = userATasks.find(
      (t) => t.id === parentTaskA.id
    )

    console.log(
      '📊 Utilisateur A - Tâche parente a',
      parentTaskWithSubtasks?.subtasks.length,
      'sous-tâches'
    )
    expect(parentTaskWithSubtasks?.subtasks).toHaveLength(2)

    // ÉTAPE 2: L'utilisateur A exporte ses tâches
    console.log("\n📤 Étape 2: L'utilisateur A exporte ses tâches")

    const exportResponse = await request(server)
      .get('/api/tasks/export')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .expect(200)

    const csvContent = exportResponse.text
    console.log('✅ Export CSV généré (' + csvContent.length + ' caractères)')

    // Afficher le contenu CSV pour debug
    console.log('\n📄 Contenu CSV exporté (avec nom de tâche parente):')
    console.log(csvContent)

    // ÉTAPE 3: L'utilisateur B importe les tâches
    console.log("\n📥 Étape 3: L'utilisateur B importe les tâches")

    const importResponse = await request(server)
      .post('/api/tasks/import')
      .set('Authorization', `Bearer ${userBAuthToken}`)
      .send({ csvContent })
      .expect(200)

    console.log(
      '✅ Import terminé:',
      importResponse.body.importedCount,
      'tâches importées'
    )
    expect(importResponse.body.importedCount).toBe(3) // 1 parent + 2 sous-tâches

    // ÉTAPE 4: Vérifier la structure pour l'utilisateur B
    console.log("\n🔍 Étape 4: Vérifier la structure pour l'utilisateur B")

    const userBTasksRes = await request(server)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userBAuthToken}`)
      .expect(200)

    const userBTasks = userBTasksRes.body
    console.log(`📊 Utilisateur B - Total des tâches: ${userBTasks.length}`)

    // Trouver la tâche parente importée (par nom)
    const importedParentTask = userBTasks.find(
      (t: any) => t.name === 'Tâche parente pour import'
    )

    if (importedParentTask) {
      console.log('✅ Tâche parente trouvée:', importedParentTask.name)
      console.log(
        '📊 Tâche parente a',
        importedParentTask.subtasks.length,
        'sous-tâches'
      )

      // Vérifier que les sous-tâches ont été importées
      expect(importedParentTask.subtasks).toHaveLength(2)

      // Vérifier que les sous-tâches ont le bon parentId
      const subtaskNames = importedParentTask.subtasks.map((s: any) => s.name)
      expect(subtaskNames).toContain('Sous-tâche 1 pour import')
      expect(subtaskNames).toContain('Sous-tâche 2 pour import')

      // Vérifier que les sous-tâches ont le bon parentId
      importedParentTask.subtasks.forEach((subtask: any) => {
        expect(subtask.parentId).toBe(importedParentTask.id)
      })

      console.log('✅ Structure des sous-tâches correctement importée !')
    } else {
      console.log("❌ Tâche parente non trouvée dans l'import")
      expect(importedParentTask).toBeDefined()
    }
  }, 15000)

  test('should handle complex nested subtask structure', async () => {
    console.log('\n🔍 Test: Structure complexe de sous-tâches imbriquées')

    // Créer une structure plus complexe : parent -> enfant -> petit-enfant
    const parentTaskRes = await request(server)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .send({
        name: 'Tâche parente complexe',
        importance: 35,
        complexity: 2
      })
      .expect(201)

    const parentTaskId = parentTaskRes.body.id

    const childTaskRes = await request(server)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .send({
        name: 'Tâche enfant',
        importance: 25,
        complexity: 3,
        parentId: parentTaskId
      })
      .expect(201)

    const childTaskId = childTaskRes.body.id

    const grandchildTaskRes = await request(server)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .send({
        name: 'Tâche petit-enfant',
        importance: 20,
        complexity: 4,
        parentId: childTaskId
      })
      .expect(201)

    console.log(
      `✅ Structure complexe créée: ${parentTaskId} -> ${childTaskId} -> ${grandchildTaskRes.body.id}`
    )

    // Exporter
    const exportRes = await request(server)
      .get('/api/tasks/export')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .set('Accept', 'text/csv')
      .expect(200)

    // Importer chez l'utilisateur B
    const importRes = await request(server)
      .post('/api/tasks/import')
      .set('Authorization', `Bearer ${userBAuthToken}`)
      .send({ csvContent: exportRes.text })
      .expect(200)

    console.log(
      `✅ Import complexe: ${importRes.body.importedCount} tâches importées`
    )

    // Vérifier la structure
    const userBTasksRes = await request(server)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userBAuthToken}`)
      .expect(200)

    const userBTasks = userBTasksRes.body
    const importedParent = userBTasks.find(
      (t: any) => t.name === 'Tâche parente complexe' && !t.parentId
    )

    if (importedParent) {
      console.log(`📊 Structure vérifiée:`)
      console.log(
        `   Parent: ${importedParent.id} (${importedParent.subtasks.length} enfants)`
      )

      // Trouver l'enfant dans les sous-tâches du parent
      const importedChild = importedParent.subtasks.find(
        (t: any) => t.name === 'Tâche enfant'
      )

      if (importedChild) {
        console.log(
          `   Enfant: ${importedChild.id}, parentId: ${importedChild.parentId}`
        )
        console.log(`   Enfant a ${importedChild.subtasks.length} sous-tâches`)

        // Trouver le petit-enfant dans les sous-tâches de l'enfant
        const importedGrandchild = importedChild.subtasks.find(
          (t: any) => t.name === 'Tâche petit-enfant'
        )

        if (importedGrandchild) {
          console.log(
            `   Petit-enfant: ${importedGrandchild.id}, parentId: ${importedGrandchild.parentId}`
          )

          // Vérifications
          expect(importedChild.parentId).toBe(importedParent.id)
          expect(importedGrandchild.parentId).toBe(importedChild.id)
          expect(importedParent.subtasks.length).toBe(1) // Un seul enfant direct
          expect(importedChild.subtasks.length).toBe(1) // Un seul petit-enfant

          console.log('✅ SUCCÈS: Structure complexe correctement importée!')
        } else {
          console.log('❌ Petit-enfant non trouvé')
          expect(importedGrandchild).toBeDefined()
        }
      } else {
        console.log('❌ Enfant non trouvé')
        expect(importedChild).toBeDefined()
      }
    } else {
      console.log('❌ Parent non trouvé')
      expect(importedParent).toBeDefined()
    }
  })
})
