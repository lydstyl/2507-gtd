import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simule le middleware d'auth (user-id)
const authHeader = { Authorization: 'Bearer dev-token' }

describe('Task API', () => {
  let server: any
  beforeAll(async () => {
    // Crée l'utilisateur de test si besoin
    await prisma.user.upsert({
      where: { id: 'user-id' },
      update: {},
      create: {
        id: 'user-id',
        email: 'user@example.com',
        password: 'hashed-password',
      },
    })
    server = app.listen(4000)
  })
  afterAll(async () => {
    await prisma.task.deleteMany({ where: { userId: 'user-id', name: 'Tâche test e2e' } })
    await prisma.task.deleteMany({ where: { userId: 'user-id', name: 'Tâche test frontend' } })
    await prisma.$disconnect()
    server.close()
  })

  it('crée une tâche avec due date puis la supprime', async () => {
    // Date de demain pour la due date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dueDate = tomorrow.toISOString().split('T')[0] // Format YYYY-MM-DD

    // Création avec due date
    const createRes = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Tâche test e2e',
        importance: 30,
        complexity: 3,
        dueDate: dueDate
      })
      .expect(201)
    
    expect(createRes.body).toHaveProperty('id')
    expect(createRes.body.name).toBe('Tâche test e2e')
    // Vérifie que la due date est bien présente (format ISO string)
    expect(createRes.body.dueDate).toContain(dueDate)
    const taskId = createRes.body.id

    // Vérification que la tâche est bien créée avec la due date
    const getRes = await request(server)
      .get('/api/tasks')
      .set(authHeader)
      .expect(200)
    
    const createdTask = getRes.body.find((t: any) => t.id === taskId)
    expect(createdTask).toBeDefined()
    expect(createdTask.name).toBe('Tâche test e2e')
    expect(createdTask.dueDate).toContain(dueDate)

    // Suppression
    await request(server)
      .delete(`/api/tasks/${taskId}`)
      .set(authHeader)
      .expect(204)

    // Vérifie que la tâche n'existe plus
    const getResAfterDelete = await request(server)
      .get('/api/tasks')
      .set(authHeader)
      .expect(200)
    expect(getResAfterDelete.body.find((t: any) => t.id === taskId)).toBeUndefined()
  })

  it('reproduit exactement le payload du frontend', async () => {
    // Payload exact envoyé par le frontend
    const frontendPayload = {
      name: 'Tâche test frontend',
      link: '',
      importance: 40,
      complexity: 2,
      dueDate: '2025-07-05T22:00:00.000Z',
      tagIds: []
    }

    const createRes = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send(frontendPayload)
      .expect(201)
    
    console.log('Response from backend:', JSON.stringify(createRes.body, null, 2))
    
    expect(createRes.body).toHaveProperty('id')
    expect(createRes.body.name).toBe('Tâche test frontend')
    expect(createRes.body.dueDate).toBeDefined()
    expect(createRes.body.dueDate).toContain('2025-07-05')
    
    const taskId = createRes.body.id

    // Suppression
    await request(server)
      .delete(`/api/tasks/${taskId}`)
      .set(authHeader)
      .expect(204)
  })
}) 