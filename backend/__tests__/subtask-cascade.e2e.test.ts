import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simule le middleware d'auth (user-id)
const authHeader = { Authorization: 'Bearer dev-token' }

describe('Subtask Cascade Delete API', () => {
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
    server = app.listen(4003)
  })
  afterAll(async () => {
    await prisma.task.deleteMany({ where: { userId: 'user-id', name: 'Tâche parente cascade' } })
    await prisma.task.deleteMany({ where: { userId: 'user-id', name: 'Sous-tâche cascade 1' } })
    await prisma.task.deleteMany({ where: { userId: 'user-id', name: 'Sous-tâche cascade 2' } })
    await prisma.task.deleteMany({ where: { userId: 'user-id', name: 'Sous-tâche cascade 3' } })
    await prisma.$disconnect()
    server.close()
  })

  it('supprime une tâche parente et vérifie que toutes ses sous-tâches sont supprimées', async () => {
    // 1. Créer la tâche parente
    const parentTaskRes = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Tâche parente cascade',
        importance: 5,
        urgency: 5,
        priority: 5,
        link: '',
        tagIds: []
      })
      .expect(201)

    const parentTaskId = parentTaskRes.body.id
    expect(parentTaskRes.body.name).toBe('Tâche parente cascade')

    // 2. Créer plusieurs sous-tâches
    const subtask1Res = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Sous-tâche cascade 1',
        importance: 3,
        urgency: 3,
        priority: 3,
        link: '',
        tagIds: [],
        parentId: parentTaskId
      })
      .expect(201)

    const subtask2Res = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Sous-tâche cascade 2',
        importance: 4,
        urgency: 4,
        priority: 4,
        link: '',
        tagIds: [],
        parentId: parentTaskId
      })
      .expect(201)

    const subtask3Res = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Sous-tâche cascade 3',
        importance: 2,
        urgency: 2,
        priority: 2,
        link: '',
        tagIds: [],
        parentId: parentTaskId
      })
      .expect(201)

    // 3. Vérifier que la tâche parente a 3 sous-tâches
    const parentTaskWithSubtasksRes = await request(server)
      .get(`/api/tasks/${parentTaskId}`)
      .set(authHeader)
      .expect(200)

    expect(parentTaskWithSubtasksRes.body.subtasks).toHaveLength(3)
    expect(parentTaskWithSubtasksRes.body.subtasks.map((st: any) => st.name)).toContain('Sous-tâche cascade 1')
    expect(parentTaskWithSubtasksRes.body.subtasks.map((st: any) => st.name)).toContain('Sous-tâche cascade 2')
    expect(parentTaskWithSubtasksRes.body.subtasks.map((st: any) => st.name)).toContain('Sous-tâche cascade 3')

    // 4. Supprimer la tâche parente
    await request(server)
      .delete(`/api/tasks/${parentTaskId}`)
      .set(authHeader)
      .expect(204)

    // 5. Vérifier que la tâche parente n'existe plus
    await request(server)
      .get(`/api/tasks/${parentTaskId}`)
      .set(authHeader)
      .expect(404)

    // 6. Vérifier que toutes les sous-tâches ont été supprimées en cascade
    await request(server)
      .get(`/api/tasks/${subtask1Res.body.id}`)
      .set(authHeader)
      .expect(404)

    await request(server)
      .get(`/api/tasks/${subtask2Res.body.id}`)
      .set(authHeader)
      .expect(404)

    await request(server)
      .get(`/api/tasks/${subtask3Res.body.id}`)
      .set(authHeader)
      .expect(404)

    // 7. Vérifier que les tâches n'apparaissent plus dans la liste générale
    const allTasksRes = await request(server)
      .get('/api/tasks')
      .set(authHeader)
      .expect(200)

    const taskNames = allTasksRes.body.map((task: any) => task.name)
    expect(taskNames).not.toContain('Tâche parente cascade')
    expect(taskNames).not.toContain('Sous-tâche cascade 1')
    expect(taskNames).not.toContain('Sous-tâche cascade 2')
    expect(taskNames).not.toContain('Sous-tâche cascade 3')
  })
}) 