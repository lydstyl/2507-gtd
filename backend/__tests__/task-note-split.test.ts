import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import { getTestAuthHeader, createTestUser } from './helpers/auth.helper'

/**
 * Split des notes API — GET /api/tasks ne doit plus embarquer les notes.
 *
 * Contrat vérifié :
 * 1. GET /api/tasks et /api/tasks/root : aucun objet ne contient `note`,
 *    mais `hasNote` indique la présence d'une note (badge UI léger).
 * 2. GET /api/tasks/:id : la note est présente (détail complet).
 * 3. `limit` / `offset` sont maintenant honorés (avant : ignorés).
 * 4. Export CSV : contient TOUJOURS les notes (ne pas casser).
 */
const prisma = new PrismaClient()
const TEST_USER = createTestUser('note-split')
const authHeader = getTestAuthHeader(TEST_USER)

const NOTE_HTML = '<h2>📋 Note de test</h2><p>Contenu <strong>important</strong>.</p>'

describe('Task API — split des notes (note hors listes)', () => {
  let server: any
  let taskWithNoteId: string
  let taskWithoutNoteId: string
  let subtaskWithNoteId: string

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { id: TEST_USER.userId },
      update: {},
      create: {
        id: TEST_USER.userId,
        email: TEST_USER.email,
        password: 'hashed-password',
      },
    })
    server = app.listen(4001)

    // Tâche racine avec note
    const withNote = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({ name: 'Note split — avec note', importance: 300, complexity: 3, note: NOTE_HTML })
      .expect(201)
    taskWithNoteId = withNote.body.id

    // Tâche racine sans note
    const withoutNote = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({ name: 'Note split — sans note', importance: 250, complexity: 2 })
      .expect(201)
    taskWithoutNoteId = withoutNote.body.id

    // Sous-tâche avec note (vérifie le mapping récursif)
    const subtask = await request(server)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Note split — sous-tâche',
        importance: 200,
        complexity: 1,
        note: '<p>Note de la sous-tâche</p>',
        parentId: taskWithNoteId,
      })
      .expect(201)
    subtaskWithNoteId = subtask.body.id
  })

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { userId: TEST_USER.userId } })
    await prisma.$disconnect()
    server.close()
  })

  it('GET /api/tasks ne renvoie plus les notes mais expose hasNote', async () => {
    const res = await request(server).get('/api/tasks').set(authHeader).expect(200)
    const tasks = res.body as any[]

    expect(Array.isArray(tasks)).toBe(true)

    const withNote = tasks.find((t) => t.id === taskWithNoteId)
    const withoutNote = tasks.find((t) => t.id === taskWithoutNoteId)

    expect(withNote).toBeDefined()
    expect(withoutNote).toBeDefined()

    // La note ne doit JAMAIS apparaître dans la liste
    for (const t of tasks) {
      expect(t).not.toHaveProperty('note')
    }

    // hasNote est le flag léger qui remplace la note en liste
    expect(withNote.hasNote).toBe(true)
    expect(withoutNote.hasNote).toBe(false)

    // Les sous-tâches embarquées suivent la même règle
    const parentWithSubtasks = tasks.find((t) => t.subtasks?.some((s: any) => s.id === subtaskWithNoteId))
    expect(parentWithSubtasks).toBeDefined()
    const embedded = parentWithSubtasks.subtasks.find((s: any) => s.id === subtaskWithNoteId)
    expect(embedded).not.toHaveProperty('note')
    expect(embedded.hasNote).toBe(true)
  })

  it('GET /api/tasks allège les tags en liste (détail garde tout)', async () => {
    // Créer un tag pour la tâche afin de vérifier l'allègement
    const tagRes = await request(server)
      .post('/api/tags')
      .set(authHeader)
      .send({ name: `note-split-tag-${Date.now()}`, color: '#123456' })
      .expect(201)
    const tagId = tagRes.body.id

    await prisma.taskTag.create({
      data: { id: `ctag-${Date.now()}`, taskId: taskWithNoteId, tagId },
    })

    // En liste : tags réduits à id/name/color (userId reste, cf. tests isolation)
    const listRes = await request(server).get('/api/tasks').set(authHeader).expect(200)
    const listed = listRes.body.find((t: any) => t.id === taskWithNoteId)
    expect(listed.tags.length).toBeGreaterThan(0)
    for (const tag of listed.tags) {
      expect(Object.keys(tag).sort()).toEqual(['color', 'id', 'name'])
    }
    expect(listed.userId).toBe(TEST_USER.userId)

    // En détail : tags complets
    const detailRes = await request(server)
      .get(`/api/tasks/${taskWithNoteId}`)
      .set(authHeader)
      .expect(200)
    expect(detailRes.body.userId).toBe(TEST_USER.userId)
    const fullTag = detailRes.body.tags.find((t: any) => t.id === tagId)
    expect(fullTag).toBeDefined()
    expect(fullTag.color).toBe('#123456')
    expect(fullTag).toHaveProperty('createdAt')
    expect(fullTag).toHaveProperty('position')
  })

  it('GET /api/tasks/root ne renvoie pas non plus les notes', async () => {
    const res = await request(server).get('/api/tasks/root').set(authHeader).expect(200)
    const tasks = res.body as any[]

    for (const t of tasks) {
      expect(t).not.toHaveProperty('note')
    }

    const withNote = tasks.find((t) => t.id === taskWithNoteId)
    expect(withNote.hasNote).toBe(true)
  })

  it('GET /api/tasks/:id renvoie la note complète', async () => {
    const res = await request(server)
      .get(`/api/tasks/${taskWithNoteId}`)
      .set(authHeader)
      .expect(200)

    expect(res.body.note).toBe(NOTE_HTML)
    expect(res.body.hasNote).toBe(true)
  })

  it('GET /api/tasks/:id sur une tâche sans note → note falsy, hasNote false', async () => {
    const res = await request(server)
      .get(`/api/tasks/${taskWithoutNoteId}`)
      .set(authHeader)
      .expect(200)

    // Comportement historique du backend : note: null (falsy) pour une tâche
    // sans note en détail. Le frontend traite null/undefined de la même façon.
    expect(res.body.note).toBeFalsy()
    expect(res.body.hasNote).toBe(false)
  })

  it('limit est honoré sur GET /api/tasks (avant : ignoré)', async () => {
    const res = await request(server)
      .get('/api/tasks?limit=2')
      .set(authHeader)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeLessThanOrEqual(2)
  })

  it('limit + offset paginent correctement', async () => {
    const page1 = await request(server)
      .get('/api/tasks?limit=1&offset=0')
      .set(authHeader)
      .expect(200)
    const page2 = await request(server)
      .get('/api/tasks?limit=1&offset=1')
      .set(authHeader)
      .expect(200)

    expect(page1.body.length).toBe(1)
    expect(page2.body.length).toBe(1)
    // Deux pages différentes (sauf si une seule tâche — mais on en a créé 2 racines)
    expect(page1.body[0].id).not.toBe(page2.body[0].id)
  })

  it('limit est honoré sur GET /api/tasks/root', async () => {
    const res = await request(server)
      .get('/api/tasks/root?limit=1')
      .set(authHeader)
      .expect(200)

    expect(res.body.length).toBe(1)
  })

  it('export CSV contient toujours les notes', async () => {
    const res = await request(server)
      .get('/api/tasks/export')
      .set(authHeader)
      .expect(200)
      .expect('Content-Type', /text\/csv/)

    const csv = res.text
    expect(csv).toContain('Note de test')
    expect(csv).toContain('important')
    expect(csv).toContain('Note de la sous-tâche')
  })
})
