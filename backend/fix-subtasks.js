const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSubtasks() {
  try {
    console.log('🔍 Vérification des tâches...')
    
    // Récupérer toutes les tâches
    const allTasks = await prisma.task.findMany({
      where: { userId: 'user-id' },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log('📋 Tâches trouvées:')
    allTasks.forEach(task => {
      console.log(`- ${task.name} (ID: ${task.id}, ParentID: ${task.parentId || 'null'})`)
    })
    
    // Trouver la tâche "tache 2"
    const tache2 = allTasks.find(task => task.name === 'tache 2')
    const sousTache1 = allTasks.find(task => task.name === 'sous tache 1 de tache 2 ')
    const sousTache2 = allTasks.find(task => task.name === 'sous tache 2 de tache 2')
    
    if (tache2) {
      console.log('\n🔧 Correction de la hiérarchie...')
      
      // Mettre à jour la première sous-tâche
      if (sousTache1 && sousTache1.parentId !== tache2.id) {
        await prisma.task.update({
          where: { id: sousTache1.id },
          data: { parentId: tache2.id }
        })
        console.log(`✅ Sous-tâche "${sousTache1.name}" liée à "${tache2.name}"`)
      }
      
      // Mettre à jour la deuxième sous-tâche
      if (sousTache2 && sousTache2.parentId !== tache2.id) {
        await prisma.task.update({
          where: { id: sousTache2.id },
          data: { parentId: tache2.id }
        })
        console.log(`✅ Sous-tâche "${sousTache2.name}" liée à "${tache2.name}"`)
      }
    } else {
      console.log('❌ Tâche parent "tache 2" non trouvée')
    }
    
    // Vérifier le résultat
    console.log('\n📊 Résultat après correction:')
    const updatedTasks = await prisma.task.findMany({
      where: { userId: 'user-id' },
      include: { subtasks: true },
      orderBy: { createdAt: 'asc' }
    })
    
    updatedTasks.forEach(task => {
      console.log(`- ${task.name} (ID: ${task.id}, ParentID: ${task.parentId || 'null'}, Sous-tâches: ${task.subtasks.length})`)
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSubtasks() 