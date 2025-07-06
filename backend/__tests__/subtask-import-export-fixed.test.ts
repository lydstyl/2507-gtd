import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/services/authService'
import { PrismaUserRepository } from '../src/infrastructure/repositories/PrismaUserRepository'

const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)
const authService = new AuthService(userRepository)

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
    const userA = await authService.register(userAEmail, testPassword)
    const userB = await authService.register(userBEmail, testPassword)
    userAId = userA.id
    userBId = userB.id
    
    const userAAuthResult = await authService.login(userAEmail, testPassword)
    const userBAuthResult = await authService.login(userBEmail, testPassword)
    userAAuthToken = userAAuthResult.token
    userBAuthToken = userBAuthResult.token
    
    server = app.listen(4004)
  })

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
    server.close()
  })

  test('should correctly import/export subtasks between users with parent name mapping', async () => {
    console.log('🔍 Test: Import/export des sous-tâches corrigé entre utilisateurs')
    
    // ÉTAPE 1: L'utilisateur A crée des tâches avec sous-tâches
    console.log('\n📝 Étape 1: L\'utilisateur A crée des tâches avec sous-tâches')
    
    // Créer la tâche parente
    const parentTaskRes = await request(server)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .send({
        name: 'Tâche parente pour import',
        importance: 3,
        urgency: 4,
        priority: 5,
        link: 'https://parent-task-import.com'
      })
      .expect(201)

    const parentTaskId = parentTaskRes.body.id
    console.log(`✅ Tâche parente créée: ${parentTaskId}`)

    // Créer des sous-tâches
    const subtask1Res = await request(server)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .send({
        name: 'Sous-tâche 1 pour import',
        importance: 2,
        urgency: 3,
        priority: 4,
        parentId: parentTaskId
      })
      .expect(201)

    const subtask2Res = await request(server)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .send({
        name: 'Sous-tâche 2 pour import',
        importance: 1,
        urgency: 2,
        priority: 3,
        parentId: parentTaskId
      })
      .expect(201)

    console.log(`✅ Sous-tâches créées: ${subtask1Res.body.id}, ${subtask2Res.body.id}`)

    // Vérifier que la structure est correcte pour l'utilisateur A
    const userATasksRes = await request(server)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .expect(200)

    const userATasks = userATasksRes.body
    const parentTaskA = userATasks.find((t: any) => t.id === parentTaskId)
    console.log(`📊 Utilisateur A - Tâche parente a ${parentTaskA.subtasks.length} sous-tâches`)

    // ÉTAPE 2: L'utilisateur A exporte ses tâches
    console.log('\n📤 Étape 2: L\'utilisateur A exporte ses tâches')
    
    const exportRes = await request(server)
      .get('/api/tasks/export')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .set('Accept', 'text/csv')
      .expect(200)

    const csvContent = exportRes.text
    console.log(`✅ Export CSV généré (${csvContent.length} caractères)`)
    
    // Afficher le contenu CSV pour debug
    console.log('\n📄 Contenu CSV exporté (avec nom de tâche parente):')
    console.log(csvContent)

    // ÉTAPE 3: L'utilisateur B importe les tâches
    console.log('\n📥 Étape 3: L\'utilisateur B importe les tâches')
    
    const importRes = await request(server)
      .post('/api/tasks/import')
      .set('Authorization', `Bearer ${userBAuthToken}`)
      .send({ csvContent })
      .expect(200)

    console.log(`✅ Import terminé: ${importRes.body.importedCount} tâches importées`)
    if (importRes.body.errors.length > 0) {
      console.log(`⚠️ Erreurs d'import:`, importRes.body.errors)
    }

    // ÉTAPE 4: Vérifier la structure pour l'utilisateur B
    console.log('\n🔍 Étape 4: Vérifier la structure pour l\'utilisateur B')
    
    const userBTasksRes = await request(server)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userBAuthToken}`)
      .expect(200)

    const userBTasks = userBTasksRes.body
    console.log(`📊 Utilisateur B - Total des tâches: ${userBTasks.length}`)

    // Trouver la tâche parente importée (par nom)
    const importedParentTask = userBTasks.find((t: any) => 
      t.name === 'Tâche parente pour import' && !t.parentId
    )
    
    if (importedParentTask) {
      console.log(`✅ Tâche parente trouvée: ${importedParentTask.id}`)
      console.log(`📊 Sous-tâches: ${importedParentTask.subtasks.length}`)
      
      // Les sous-tâches sont dans le champ subtasks de la tâche parente
      const subtask1 = importedParentTask.subtasks.find((t: any) => 
        t.name === 'Sous-tâche 1 pour import'
      )
      const subtask2 = importedParentTask.subtasks.find((t: any) => 
        t.name === 'Sous-tâche 2 pour import'
      )
      
      if (subtask1) {
        console.log(`📋 Sous-tâche 1: ${subtask1.id}, parentId: ${subtask1.parentId}`)
        console.log(`   Parent attendu: ${importedParentTask.id}`)
        console.log(`   Parent correct: ${subtask1.parentId === importedParentTask.id}`)
      }
      
      if (subtask2) {
        console.log(`📋 Sous-tâche 2: ${subtask2.id}, parentId: ${subtask2.parentId}`)
        console.log(`   Parent attendu: ${importedParentTask.id}`)
        console.log(`   Parent correct: ${subtask2.parentId === importedParentTask.id}`)
      }
      
      // VÉRIFICATIONS: Les sous-tâches doivent maintenant être correctement liées
      expect(importedParentTask.subtasks.length).toBe(2) // Maintenant ça devrait passer
      expect(subtask1?.parentId).toBe(importedParentTask.id) // Maintenant ça devrait passer
      expect(subtask2?.parentId).toBe(importedParentTask.id) // Maintenant ça devrait passer
      
      console.log('✅ SUCCÈS: Les sous-tâches sont correctement liées à la tâche parente importée!')
      
    } else {
      console.log('❌ Tâche parente non trouvée dans l\'import')
      expect(importedParentTask).toBeDefined()
    }
  })

  test('should handle complex nested subtask structure', async () => {
    console.log('\n🔍 Test: Structure complexe de sous-tâches imbriquées')
    
    // Créer une structure plus complexe : parent -> enfant -> petit-enfant
    const parentTaskRes = await request(server)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .send({
        name: 'Tâche parente complexe',
        importance: 1,
        urgency: 2,
        priority: 3
      })
      .expect(201)

    const parentTaskId = parentTaskRes.body.id

    const childTaskRes = await request(server)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .send({
        name: 'Tâche enfant',
        importance: 2,
        urgency: 3,
        priority: 4,
        parentId: parentTaskId
      })
      .expect(201)

    const childTaskId = childTaskRes.body.id

    const grandchildTaskRes = await request(server)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAAuthToken}`)
      .send({
        name: 'Tâche petit-enfant',
        importance: 3,
        urgency: 4,
        priority: 5,
        parentId: childTaskId
      })
      .expect(201)

    console.log(`✅ Structure complexe créée: ${parentTaskId} -> ${childTaskId} -> ${grandchildTaskRes.body.id}`)

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

    console.log(`✅ Import complexe: ${importRes.body.importedCount} tâches importées`)

    // Vérifier la structure
    const userBTasksRes = await request(server)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userBAuthToken}`)
      .expect(200)

    const userBTasks = userBTasksRes.body
    const importedParent = userBTasks.find((t: any) => 
      t.name === 'Tâche parente complexe' && !t.parentId
    )
    
    if (importedParent) {
      console.log(`📊 Structure vérifiée:`)
      console.log(`   Parent: ${importedParent.id} (${importedParent.subtasks.length} enfants)`)
      
      // Trouver l'enfant dans les sous-tâches du parent
      const importedChild = importedParent.subtasks.find((t: any) => 
        t.name === 'Tâche enfant'
      )
      
      if (importedChild) {
        console.log(`   Enfant: ${importedChild.id}, parentId: ${importedChild.parentId}`)
        console.log(`   Enfant a ${importedChild.subtasks.length} sous-tâches`)
        
        // Trouver le petit-enfant dans les sous-tâches de l'enfant
        const importedGrandchild = importedChild.subtasks.find((t: any) => 
          t.name === 'Tâche petit-enfant'
        )
        
        if (importedGrandchild) {
          console.log(`   Petit-enfant: ${importedGrandchild.id}, parentId: ${importedGrandchild.parentId}`)

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