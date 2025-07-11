import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simule le middleware d'auth (user-id)
const authHeader = { Authorization: 'Bearer dev-token' }

describe('Subtask API', () => {
  let server: any
  beforeAll(async () => {
    // Crée l'utilisateur de test si besoin
    await prisma.user.upsert({
      where: { id: 'user-id' },
      update: {},
      create: {
        id: 'user-id',
        email: 'user@example.com',
        password: 'hashed-password'
      }
    })
    server = app.listen(4004)
  }, 15000)
  afterAll(async () => {
    await prisma.task.deleteMany({
      where: { userId: 'user-id', name: 'Tâche parente test' }
    })
    await prisma.task.deleteMany({
      where: { userId: 'user-id', name: 'Sous-tâche 1' }
    })
    await prisma.task.deleteMany({
      where: { userId: 'user-id', name: 'Sous-tâche 2' }
    })
    await prisma.task.deleteMany({
      where: { userId: 'user-id', name: 'Sous-tâche 3' }
    })
    await prisma.$disconnect()
    if (server) server.close()
  }, 15000)

  it('crée une tâche parente, ajoute 2 sous-tâches, supprime une sous-tâche et vérifie', async () => {
    // 1. Créer la tâche parente
    const parentTaskRes = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Tâche parente test',
        importance: 5,
        urgency: 5,
        priority: 5,
        link: '',
        tagIds: []
      })
      .expect(201)

    const parentTaskId = parentTaskRes.body.id
    expect(parentTaskRes.body.name).toBe('Tâche parente test')
    expect(parentTaskRes.body.subtasks).toEqual([])

    // 2. Créer la première sous-tâche
    const subtask1Res = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Sous-tâche 1',
        importance: 3,
        urgency: 3,
        priority: 3,
        link: '',
        tagIds: [],
        parentId: parentTaskId
      })
      .expect(201)

    expect(subtask1Res.body.name).toBe('Sous-tâche 1')
    expect(subtask1Res.body.parentId).toBe(parentTaskId)

    // 3. Créer la deuxième sous-tâche
    const subtask2Res = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Sous-tâche 2',
        importance: 4,
        urgency: 4,
        priority: 4,
        link: '',
        tagIds: [],
        parentId: parentTaskId
      })
      .expect(201)

    expect(subtask2Res.body.name).toBe('Sous-tâche 2')
    expect(subtask2Res.body.parentId).toBe(parentTaskId)

    // 4. Vérifier que la tâche parente a maintenant 2 sous-tâches
    const parentTaskWithSubtasksRes = await request(server)
      .get(`/api/tasks/${parentTaskId}`)
      .set(authHeader)
      .expect(200)

    expect(parentTaskWithSubtasksRes.body.subtasks).toHaveLength(2)
    expect(
      parentTaskWithSubtasksRes.body.subtasks.map((st: any) => st.name)
    ).toContain('Sous-tâche 1')
    expect(
      parentTaskWithSubtasksRes.body.subtasks.map((st: any) => st.name)
    ).toContain('Sous-tâche 2')

    // 5. Supprimer la première sous-tâche
    await request(server)
      .delete(`/api/tasks/${subtask1Res.body.id}`)
      .set(authHeader)
      .expect(204)

    // 6. Vérifier que la tâche parente n'a plus qu'une sous-tâche
    const parentTaskAfterDeleteRes = await request(server)
      .get(`/api/tasks/${parentTaskId}`)
      .set(authHeader)
      .expect(200)

    expect(parentTaskAfterDeleteRes.body.subtasks).toHaveLength(1)
    expect(parentTaskAfterDeleteRes.body.subtasks[0].name).toBe('Sous-tâche 2')

    // 7. Vérifier que la sous-tâche supprimée n'existe plus
    await request(server)
      .get(`/api/tasks/${subtask1Res.body.id}`)
      .set(authHeader)
      .expect(404)
  }, 15000)
})
