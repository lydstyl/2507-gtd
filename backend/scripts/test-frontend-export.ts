import { AuthService } from '../src/services/authService'
import { PrismaUserRepository } from '../src/infrastructure/repositories/PrismaUserRepository'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)
const authService = new AuthService(userRepository)

async function testFrontendExport() {
  console.log("🔄 Test de l'export CSV comme le frontend...")

  // 1. Créer un utilisateur de test
  const testEmail = 'test-export-frontend@example.com'
  const testPassword = 'test-password-123'

  console.log("📝 1. Création de l'utilisateur...")
  const user = await authService.register(testEmail, testPassword)
  console.log('✅ Utilisateur créé:', { id: user.id, email: user.email })

  // 2. Authentifier l'utilisateur
  console.log('🔐 2. Authentification...')
  const authResult = await authService.login(testEmail, testPassword)
  const token = authResult.token
  console.log('✅ Token obtenu:', token.substring(0, 20) + '...')

  // 3. Créer quelques tâches de test
  console.log('📋 3. Création de tâches de test...')
  await prisma.task.createMany({
    data: [
      {
        name: 'Tâche test export 1',
        importance: 1,
        urgency: 2,
        priority: 3,
        userId: user.id
      },
      {
        name: 'Tâche test export 2',
        importance: 4,
        urgency: 5,
        priority: 6,
        userId: user.id
      }
    ]
  })
  console.log('✅ Tâches créées')

  // 4. Tester l'export CSV avec le token
  console.log("📤 4. Test de l'export CSV...")

  const response = await fetch('http://localhost:3000/api/tasks/export', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/csv'
    }
  })

  console.log('📊 Réponse du serveur:')
  console.log('- Status:', response.status)
  console.log('- Headers:', Object.fromEntries(response.headers.entries()))

  if (response.ok) {
    const csvContent = await response.text()
    console.log('✅ Export réussi !')
    console.log('📄 Contenu CSV:')
    console.log(csvContent)
  } else {
    const errorData = await response.json()
    console.log("❌ Erreur d'export:")
    console.log(errorData)
  }

  // 5. Nettoyer
  console.log('🧹 5. Nettoyage...')
  await prisma.task.deleteMany({
    where: { userId: user.id }
  })
  await prisma.user.delete({
    where: { id: user.id }
  })
  await prisma.$disconnect()

  console.log('✅ Test terminé !')
}

testFrontendExport().catch(console.error)
