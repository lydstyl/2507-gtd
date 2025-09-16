import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../src/services/authService'
import { PrismaUserRepository } from '../src/infrastructure/repositories/PrismaUserRepository'

const prisma = new PrismaClient()
const userRepository = new PrismaUserRepository(prisma)
const authService = new AuthService(userRepository)

describe('CSV Import Tests', () => {
  const testEmail = 'test-csv-import@example.com'
  const testPassword = 'test-password-123'
  let userId: string
  let authToken: string
  let server: any

  beforeAll(async () => {
    // Nettoyer les données de test existantes
    await prisma.task.deleteMany({ where: { user: { email: testEmail } } })
    await prisma.tag.deleteMany({ where: { user: { email: testEmail } } })
    await prisma.user.deleteMany({ where: { email: testEmail } })

    // Créer l'utilisateur de test
    const user = await authService.register(testEmail, testPassword)
    userId = user.id
    const authResult = await authService.login(testEmail, testPassword)
    authToken = authResult.token
    server = app.listen(4005)
  }, 15000)

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { user: { email: testEmail } } })
    await prisma.tag.deleteMany({ where: { user: { email: testEmail } } })
    await prisma.user.deleteMany({ where: { email: testEmail } })
    await prisma.$disconnect()
    if (server) server.close()
  }, 15000)

  test('should import tasks from CSV and create tags', async () => {
    const csvContent = [
      'ID,Nom,Lien,Note,Importance,Complexité,Points,Date limite,Date de création,Date de modification,Tâche parente,Nom tâche parente,Tags',
      ',Tâche importée 1,,,1,2,5,2025-07-20,,,,,Tag1;Tag2',
      ',Tâche importée 2,https://import2.com,,5,5,10,,,,,,Tag2',
      ',Tâche importée 3,,,3,3,10,,,,,,'
    ].join('\n')

    // Import via l'API
    const importRes = await request(server)
      .post('/api/tasks/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ csvContent })
      .expect(200)

    expect(importRes.body.importedCount).toBe(3)
    expect(importRes.body.errors).toHaveLength(0)

    // Vérifier que les tâches sont bien importées
    const tasksRes = await request(server)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    const tasks = tasksRes.body
    expect(tasks.length).toBeGreaterThanOrEqual(3)
    const t1 = tasks.find((t: any) => t.name === 'Tâche importée 1')
    const t2 = tasks.find((t: any) => t.name === 'Tâche importée 2')
    const t3 = tasks.find((t: any) => t.name === 'Tâche importée 3')
    expect(t1).toBeDefined()
    expect(t2).toBeDefined()
    expect(t3).toBeDefined()
    expect(t1.tags.map((tag: any) => tag.name).sort()).toEqual(['Tag1', 'Tag2'])
    expect(t2.tags.map((tag: any) => tag.name)).toEqual(['Tag2'])
    expect(t3.tags).toEqual([])
    expect(t1.importance).toBe(1)
    expect(t1.complexity).toBe(2)
    expect(t1.points).toBe(5) // 1*10/2 = 5
    expect(t1.dueDate).toContain('2025-07-20')
    expect(t2.link).toBe('https://import2.com')
  })

  test('should reject import without authentication', async () => {
    const csvContent =
      'ID,Nom,Lien,Note,Importance,Complexité,Points,Date limite,Date de création,Date de modification,Tâche parente,Nom tâche parente,Tags\n,Tâche sans auth,,,5,5,10,,,,,,'
    await request(server)
      .post('/api/tasks/import')
      .send({ csvContent })
      .expect(401)
  })

  test('should return errors for invalid CSV', async () => {
    const csvContent = [
      'ID,Nom,Lien,Note,Importance,Complexité,Points,Date limite,Date de création,Date de modification,Tâche parente,Nom tâche parente,Tags',
      ',,Lien manquant,,abc,2,10,2025-07-20,,,,,Tag1;Tag2', // nom manquant, importance invalide
      ',Tâche mauvaise importance,,,abc,2,10,2025-07-20,,,,,Tag1;Tag2' // importance invalide
    ].join('\n')

    const importRes = await request(server)
      .post('/api/tasks/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ csvContent })
      .expect(200)

    expect(importRes.body.importedCount).toBe(0)
    expect(importRes.body.errors.length).toBeGreaterThan(0)
    expect(importRes.body.errors.join(' ')).toMatch(
      /nom de la tâche|Importance invalide/i
    )
  })

  test('should import all tasks from real CSV file', async () => {
    // Lire le fichier CSV réel
    const fs = require('fs')
    const path = require('path')
    const csvFilePath = path.join(__dirname, 'tasks-export-2025-07-12.csv')
    
    if (!fs.existsSync(csvFilePath)) {
      console.log('Fichier CSV de test non trouvé, test ignoré')
      return
    }

    // Afficher l'userId utilisé pour l'import
    console.log('userId utilisé pour l\'import:', userId)
    // Supprimer toutes les tâches de cet utilisateur
    await prisma.task.deleteMany({ where: { userId } })

    const csvContent = fs.readFileSync(csvFilePath, 'utf8')
    const lines = csvContent.split('\n').filter((line: string) => line.trim() !== '')
    const expectedTaskCount = lines.length - 1 // Exclure l'en-tête

    console.log(`Nombre de lignes dans le CSV: ${lines.length}`)
    console.log(`Nombre de tâches attendues: ${expectedTaskCount}`)

    // Import via l'API
    const importRes = await request(server)
      .post('/api/tasks/import')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ csvContent })
      .expect(200)

    console.log(`Tâches importées: ${importRes.body.importedCount}`)
    console.log(`Erreurs: ${importRes.body.errors.length}`)
    if (importRes.body.errors.length > 0) {
      console.log('Erreurs détaillées:', importRes.body.errors)
    }

    // Vérifier que toutes les tâches sont importées
    expect(importRes.body.importedCount).toBe(expectedTaskCount)
    expect(importRes.body.errors).toHaveLength(0)

    // Vérifier que les tâches sont bien dans la base de données
    const totalTasksInDb = await prisma.task.count({ where: { userId } })
    console.log(`Tâches dans la base de données (toutes, y compris sous-tâches): ${totalTasksInDb}`)
    
    // Vérifier que le nombre de tâches correspond exactement
    expect(totalTasksInDb).toBe(expectedTaskCount)
  })
})
