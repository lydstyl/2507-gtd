import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/services/authService'
import { PrismaUserRepository } from '../src/infrastructure/repositories/PrismaUserRepository'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'
import { PrismaTagRepository } from '../src/infrastructure/repositories/PrismaTagRepository'
import { ExportTasksUseCase } from '../src/usecases/tasks/ExportTasksUseCase'

const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)
const authService = new AuthService(userRepository)
const taskRepository = new PrismaTaskRepository(prisma)
const tagRepository = new PrismaTagRepository(prisma)

async function testExport() {
  console.log("🔄 Test d'export CSV...")

  try {
    // 1. Créer ou récupérer un utilisateur de test
    const testEmail = 'test-export@example.com'
    const testPassword = 'test-password-123'

    let userId: string
    try {
      const loginResult = await authService.login(testEmail, testPassword)
      userId = loginResult.user.id
      console.log('✅ Utilisateur existant connecté:', loginResult.user.email)
    } catch {
      const registerResult = await authService.register(testEmail, testPassword)
      userId = registerResult.id
      console.log('✅ Nouvel utilisateur créé:', registerResult.email)
    }

    // 2. Créer quelques tâches de test
    console.log('📝 Création des tâches de test...')

    const task1 = await taskRepository.create({
      name: 'Tâche de test 1',
      importance: 1,
      urgency: 2,
      priority: 1,
      link: 'https://example.com/test1',
      dueDate: new Date('2025-07-15'),
      userId: userId
    })

    const task2 = await taskRepository.create({
      name: 'Tâche de test 2',
      importance: 5,
      urgency: 5,
      priority: 5,
      userId: userId
    })

    console.log('✅ Tâches créées:', [task1.name, task2.name])

    // 3. Créer un tag
    console.log("🏷️ Création d'un tag...")
    const tag = await tagRepository.create({
      name: 'Tag de test',
      color: '#00ff00',
      userId: userId
    })

    // 4. Créer une tâche avec le tag
    console.log("📋 Création d'une tâche avec tag...")
    const taskWithTag = await taskRepository.create({
      name: 'Tâche avec tag de test',
      importance: 3,
      urgency: 4,
      priority: 3,
      userId: userId,
      tagIds: [tag.id]
    })

    console.log('✅ Tâche avec tag créée:', taskWithTag.name)

    // 5. Tester l'export direct via le cas d'usage
    console.log("📤 Test de l'export via le cas d'usage...")
    const exportUseCase = new ExportTasksUseCase(taskRepository)
    const csvContent = await exportUseCase.execute(userId)

    console.log('✅ Export CSV réussi !')
    console.log('📄 Contenu CSV:')
    console.log(csvContent)

    // 6. Afficher le token pour tester avec curl
    const authResult = await authService.login(testEmail, testPassword)
    console.log('\n🔑 Token pour test curl:')
    console.log(authResult.token)

    console.log('\n📋 Commande curl pour tester:')
    console.log(
      `curl -H "Authorization: Bearer ${authResult.token}" http://localhost:3000/api/tasks/export`
    )
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testExport()
