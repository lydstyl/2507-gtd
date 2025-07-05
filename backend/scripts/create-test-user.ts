import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { id: 'user-id' }
    })

    if (existingUser) {
      console.log('✅ Utilisateur de test existe déjà')
      return
    }

    // Créer l'utilisateur de test
    const user = await prisma.user.create({
      data: {
        id: 'user-id',
        email: 'user@example.com',
        password: 'hashed-password-for-test' // En production, il faudrait hasher le mot de passe
      }
    })

    console.log('✅ Utilisateur de test créé:', user)
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur de test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser() 