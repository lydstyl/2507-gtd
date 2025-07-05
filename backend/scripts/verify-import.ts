import { PrismaClient } from '@prisma/client'
import { PrismaUserRepository } from '../src/infrastructure/repositories/PrismaUserRepository'

const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)

async function verifyImport() {
  try {
    console.log('🔍 Vérification de l\'import...')
    
    // Trouver l'utilisateur
    const user = await userRepository.findByEmail('lydstyl@gmail.com')
    if (!user) {
      console.log('❌ Utilisateur lydstyl@gmail.com non trouvé')
      return
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.id}`)
    
    // Récupérer quelques tâches avec leurs tags
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`\n📊 Aperçu de ${tasks.length} tâches récemment créées:`)
    console.log('─'.repeat(100))
    
    tasks.forEach((task, index) => {
      const tagNames = task.tags.map(tt => tt.tag.name).join(', ')
      console.log(`${index + 1}. "${task.name}"`)
      console.log(`   Importance: ${task.importance}, Urgence: ${task.urgency}, Priorité: ${task.priority}`)
      console.log(`   Tags: ${tagNames || 'Aucun'}`)
      console.log(`   Date: ${task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'Aucune'}`)
      console.log('')
    })
    
    // Statistiques générales
    const totalTasks = await prisma.task.count({
      where: { userId: user.id }
    })
    
    const tasksWithImportance1 = await prisma.task.count({
      where: { 
        userId: user.id,
        importance: 1
      }
    })
    
    const tasksWithUrgency1 = await prisma.task.count({
      where: { 
        userId: user.id,
        urgency: 1
      }
    })
    
    console.log('📈 Statistiques:')
    console.log(`- Total des tâches: ${totalTasks}`)
    console.log(`- Tâches avec importance = 1: ${tasksWithImportance1}`)
    console.log(`- Tâches avec urgence = 1: ${tasksWithUrgency1}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  verifyImport()
} 