import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    console.log('🔧 Création de l\'utilisateur de test...')
    
    const user = await prisma.user.upsert({
      where: { id: 'user-id' },
      update: {},
      create: {
        id: 'user-id',
        email: 'user@example.com',
        password: 'test-password-hashed', // En production, il faudrait hasher le mot de passe
      },
    })

    console.log('✅ Utilisateur de test créé:', user)
    
    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: 'user-id' }
    })
    
    if (existingUser) {
      console.log('✅ Utilisateur vérifié dans la base de données')
    } else {
      console.log('❌ Utilisateur non trouvé dans la base de données')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser() 