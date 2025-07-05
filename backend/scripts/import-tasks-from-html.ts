import { PrismaClient } from '@prisma/client'
import { PrismaUserRepository } from '../src/infrastructure/repositories/PrismaUserRepository'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'
import { PrismaTagRepository } from '../src/infrastructure/repositories/PrismaTagRepository'
import { CreateTagUseCase } from '../src/usecases/tags/CreateTagUseCase'
import { CreateTaskUseCase } from '../src/usecases/tasks/CreateTaskUseCase'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)
const taskRepository = new PrismaTaskRepository(prisma)
const tagRepository = new PrismaTagRepository(prisma)
const createTagUseCase = new CreateTagUseCase(tagRepository)
const createTaskUseCase = new CreateTaskUseCase(taskRepository)

interface ParsedTask {
  name: string
  date?: string
  link?: string
  labels: number[]
}

// Mapping des couleurs vers les numéros de labels
const colorToLabelMap: { [key: string]: number } = {
  'rgb(102, 0, 255)': 1,    // Violet foncé
  'rgb(255, 0, 0)': 2,      // Rouge
  'rgb(0, 255, 255)': 3,    // Cyan
  'rgb(20, 133, 43)': 4,    // Vert
  'rgb(225, 255, 0)': 5,    // Jaune
  'rgb(128, 128, 255)': 6,  // Bleu clair
  'rgb(173, 101, 0)': 7,    // Marron
  'rgb(128, 128, 128)': 8,  // Gris
  'rgb(255, 126, 41)': 9,   // Orange
  'rgb(71, 71, 71)': 10     // Gris foncé
}

async function findOrCreateUser(email: string): Promise<string> {
  console.log(`🔍 Recherche de l'utilisateur: ${email}`)
  
  let user = await userRepository.findByEmail(email)
  
  if (!user) {
    console.log(`❌ Utilisateur ${email} non trouvé`)
    throw new Error(`Utilisateur ${email} non trouvé. Veuillez d'abord créer cet utilisateur.`)
  }
  
  console.log(`✅ Utilisateur trouvé: ${user.id}`)
  return user.id
}

async function createTagsForUser(userId: string): Promise<{ [key: number]: string }> {
  console.log('🏷️  Création des tags pour les labels...')
  
  const tagIds: { [key: number]: string } = {}
  // Mapping des labels vers les tags (seulement pour le premier label)
  const labelToTag: { [key: number]: { name: string, color: string } } = {
    3: { name: 'rapide', color: '#00ffff' },
    4: { name: 'dehors', color: '#14852b' },
    5: { name: 'santé', color: '#e1ff00' },
    6: { name: 'actif', color: '#8080ff' },
    7: { name: 'passif', color: '#ad6500' },
    8: { name: 'bureau', color: '#808080' },
    9: { name: 'recursive', color: '#ff7e29' },
    10: { name: 'déléguer', color: '#474747' }
  }
  
  // Créer les tags pour chaque label (seulement ceux qui ont des tags)
  for (const [label, tagInfo] of Object.entries(labelToTag)) {
    try {
      const tag = await createTagUseCase.execute({
        name: tagInfo.name,
        color: tagInfo.color,
        userId: userId
      })
      tagIds[parseInt(label)] = tag.id
      console.log(`✅ Tag créé: ${tagInfo.name} (${tag.id})`)
    } catch (error) {
      // Si le tag existe déjà, on le récupère
      const existingTags = await tagRepository.findAll(userId)
      const existingTag = existingTags.find(t => t.name === tagInfo.name)
      if (existingTag) {
        tagIds[parseInt(label)] = existingTag.id
        console.log(`✅ Tag existant trouvé: ${tagInfo.name} (${existingTag.id})`)
      } else {
        console.error(`❌ Erreur lors de la création du tag ${tagInfo.name}:`, error)
      }
    }
  }
  
  return tagIds
}

function parseHtmlFile(filePath: string): ParsedTask[] {
  console.log(`📄 Lecture du fichier: ${filePath}`)
  
  const htmlContent = fs.readFileSync(filePath, 'utf-8')
  const tasks: ParsedTask[] = []
  
  // Regex pour extraire les éléments <li>
  const liRegex = /<li[^>]*data-task-id="[^"]*"[^>]*>(.*?)<\/li>/gs
  
  let match
  while ((match = liRegex.exec(htmlContent)) !== null) {
    const liContent = match[1]
    
    // Extraire la date
    const dateMatch = liContent.match(/<p[^>]*class="[^"]*fixed-date[^"]*"[^>]*>([^<]+)<\/p>/)
    const date = dateMatch ? dateMatch[1].trim() : undefined
    
    // Extraire le nom
    const nameMatch = liContent.match(/<span[^>]*class="name[^"]*"[^>]*>([^<]+)<\/span>/)
    const name = nameMatch ? nameMatch[1].trim() : undefined
    
    // Extraire le lien
    const linkMatch = liContent.match(/<a[^>]*class="[^"]*link[^"]*"[^>]*href="([^"]*)"[^>]*>/)
    const link = linkMatch ? linkMatch[1] : undefined
    
    // Extraire les labels
    const labels: number[] = []
    const labelRegex = /<p[^>]*class="label[^"]*"[^>]*style="[^"]*background-color:\s*([^;]+);[^"]*"[^>]*>(\d+)<\/p>/g
    let labelMatch
    while ((labelMatch = labelRegex.exec(liContent)) !== null) {
      const color = labelMatch[1].trim()
      const labelNumber = parseInt(labelMatch[2])
      
      // Vérifier si la couleur correspond à notre mapping
      if (colorToLabelMap[color] && colorToLabelMap[color] === labelNumber) {
        labels.push(labelNumber)
      }
    }
    
    if (name) {
      tasks.push({
        name,
        date,
        link,
        labels
      })
    }
  }
  
  console.log(`📊 ${tasks.length} tâches extraites du fichier HTML`)
  return tasks
}

async function createTasks(userId: string, tasks: ParsedTask[], tagIds: { [key: number]: string }) {
  console.log(`📝 Création de ${tasks.length} tâches...`)
  
  let createdCount = 0
  let errorCount = 0
  
  for (const task of tasks) {
    try {
      // Convertir la date si elle existe
      let dueDate: Date | undefined
      if (task.date) {
        dueDate = new Date(task.date)
        if (isNaN(dueDate.getTime())) {
          console.warn(`⚠️  Date invalide pour la tâche "${task.name}": ${task.date}`)
          dueDate = undefined
        }
      }
      
      // Nouvelle logique de mapping des labels
      const taskTagIds: string[] = []
      let importance = 5 // Valeur par défaut
      let urgency = 5    // Valeur par défaut
      
      // Traiter les labels dans l'ordre
      for (let i = 0; i < task.labels.length; i++) {
        const label = task.labels[i]
        
        if (i === 0) {
          // Premier label : détermine l'importance et potentiellement l'urgence
          if (label === 1) {
            importance = 1
            // Aucun tag
          } else if (label === 2) {
            importance = 2
            // Aucun tag
          } else if (label === 3) {
            importance = 3
            if (tagIds[label]) taskTagIds.push(tagIds[label])
          } else if (label === 4) {
            importance = 4
            if (tagIds[label]) taskTagIds.push(tagIds[label])
          } else if (label === 5) {
            importance = 5
            if (tagIds[label]) taskTagIds.push(tagIds[label])
          } else if (label === 6) {
            importance = 5
            urgency = 1
            if (tagIds[label]) taskTagIds.push(tagIds[label])
          } else if (label === 7) {
            importance = 5
            urgency = 2
            if (tagIds[label]) taskTagIds.push(tagIds[label])
          } else if (label === 8) {
            importance = 5
            urgency = 3
            if (tagIds[label]) taskTagIds.push(tagIds[label])
          } else if (label === 9) {
            importance = 5
            urgency = 4
            if (tagIds[label]) taskTagIds.push(tagIds[label])
          } else if (label === 10) {
            importance = 5
            urgency = 5
            if (tagIds[label]) taskTagIds.push(tagIds[label])
          }
        } else {
          // Labels suivants : ajoutent seulement des tags
          if (tagIds[label]) {
            taskTagIds.push(tagIds[label])
          }
        }
      }
      
      // Calculer la priorité basée sur importance et urgence
      const priority = Math.round((importance + urgency) / 2)
      
      const taskData = {
        name: task.name,
        link: task.link || '',
        importance: importance,
        urgency: urgency,
        priority: priority,
        dueDate: dueDate,
        tagIds: taskTagIds,
        userId: userId
      }
      
      const createdTask = await createTaskUseCase.execute(taskData)
      createdCount++
      
      if (createdCount % 10 === 0) {
        console.log(`✅ ${createdCount} tâches créées...`)
      }
      
    } catch (error) {
      errorCount++
      console.error(`❌ Erreur lors de la création de la tâche "${task.name}":`, error)
    }
  }
  
  console.log(`\n📊 Résumé:`)
  console.log(`✅ ${createdCount} tâches créées avec succès`)
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} erreurs lors de la création`)
  }
}

async function main() {
  try {
    console.log('🚀 Début de l\'import des tâches depuis le fichier HTML...\n')
    
    // 1. Trouver l'utilisateur
    const userId = await findOrCreateUser('lydstyl@gmail.com')
    
    // 2. Créer les tags
    const tagIds = await createTagsForUser(userId)
    
    // 3. Parser le fichier HTML
    const htmlFilePath = path.join(__dirname, 'tasks-from-other-app.html')
    const tasks = parseHtmlFile(htmlFilePath)
    
    // 4. Créer les tâches
    await createTasks(userId, tasks, tagIds)
    
    console.log('\n🎉 Import terminé avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
if (require.main === module) {
  main()
} 