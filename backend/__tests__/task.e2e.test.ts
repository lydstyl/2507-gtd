import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simule le middleware d'auth (user-id)
const authHeader = { Authorization: 'Bearer dev-token' }

describe('Task API', () => {
  let server: any
  beforeAll((done) => {
    server = app.listen(4000, done)
  })
  afterAll(async () => {
    await prisma.task.deleteMany({ where: { userId: 'user-id', name: 'Tâche test e2e' } })
    await prisma.$disconnect()
    server.close()
  })

  it('crée puis supprime une tâche', async () => {
    // Création
    const createRes = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Tâche test e2e',
        importance: 5,
        urgency: 5,
        priority: 5
      })
      .expect(201)
    expect(createRes.body).toHaveProperty('id')
    expect(createRes.body.name).toBe('Tâche test e2e')
    const taskId = createRes.body.id

    // Suppression
    await request(server)
      .delete(`/api/tasks/${taskId}`)
      .set(authHeader)
      .expect(204)

    // Vérifie que la tâche n'existe plus
    const getRes = await request(server)
      .get('/api/tasks')
      .set(authHeader)
      .expect(200)
    expect(getRes.body.find((t: any) => t.id === taskId)).toBeUndefined()
  })
}) 