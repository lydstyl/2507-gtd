import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import { getTestAuthHeader, createTestUser } from './helpers/auth.helper'

const prisma = new PrismaClient()
const TEST_USER = createTestUser('tag')
const authHeader = getTestAuthHeader(TEST_USER)

describe('Tag API', () => {
  let server: any
  beforeAll(async () => {
    // Crée l'utilisateur de test si besoin
    await prisma.user.upsert({
      where: { id: TEST_USER.userId },
      update: {},
      create: {
        id: TEST_USER.userId,
        email: TEST_USER.email,
        password: 'hashed-password'
      }
    })
    server = app.listen(4007)
  }, 15000)
  afterAll(async () => {
    await prisma.tag.deleteMany({
      where: { userId: TEST_USER.userId, name: 'Tag test e2e' }
    })
    await prisma.tag.deleteMany({
      where: { userId: TEST_USER.userId, name: 'Tag test frontend' }
    })
    await prisma.$disconnect()
    if (server) server.close()
  }, 15000)

  it('crée un tag puis le supprime', async () => {
    // Création du tag
    const createRes = await request(server)
      .post('/api/tags')
      .set(authHeader)
      .send({
        name: 'Tag test e2e',
        color: '#FF5733'
      })
      .expect(201)

    expect(createRes.body).toHaveProperty('id')
    expect(createRes.body.name).toBe('Tag test e2e')
    expect(createRes.body.color).toBe('#FF5733')
    const tagId = createRes.body.id

    // Vérification que le tag est bien créé
    const getRes = await request(server)
      .get('/api/tags')
      .set(authHeader)
      .expect(200)

    const createdTag = getRes.body.find((t: any) => t.id === tagId)
    expect(createdTag).toBeDefined()
    expect(createdTag.name).toBe('Tag test e2e')
    expect(createdTag.color).toBe('#FF5733')

    // Suppression
    await request(server)
      .delete(`/api/tags/${tagId}`)
      .set(authHeader)
      .expect(204)

    // Vérifie que le tag n'existe plus
    const getResAfterDelete = await request(server)
      .get('/api/tags')
      .set(authHeader)
      .expect(200)
    expect(
      getResAfterDelete.body.find((t: any) => t.id === tagId)
    ).toBeUndefined()
  }, 15000)

  it('reproduit exactement le payload du frontend', async () => {
    // Payload exact envoyé par le frontend
    const frontendPayload = {
      name: 'Tag test frontend',
      color: '#3B82F6'
    }

    const createRes = await request(server)
      .post('/api/tags')
      .set(authHeader)
      .send(frontendPayload)
      .expect(201)

    console.log(
      'Tag response from backend:',
      JSON.stringify(createRes.body, null, 2)
    )

    expect(createRes.body).toHaveProperty('id')
    expect(createRes.body.name).toBe('Tag test frontend')
    expect(createRes.body.color).toBe('#3B82F6')

    const tagId = createRes.body.id

    // Suppression
    await request(server)
      .delete(`/api/tags/${tagId}`)
      .set(authHeader)
      .expect(204)
  })

  it('échoue à supprimer un tag inexistant', async () => {
    await request(server)
      .delete('/api/tags/non-existent-id')
      .set(authHeader)
      .expect(404)
  })

  it('échoue à créer un tag sans nom', async () => {
    await request(server)
      .post('/api/tags')
      .set(authHeader)
      .send({
        color: '#FF5733'
      })
      .expect(400)
  })
})
