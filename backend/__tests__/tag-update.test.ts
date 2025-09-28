import request from 'supertest'
import app from '../src/app'
import { Container } from '../src/infrastructure/container'

async function deleteAllTags(authToken: string) {
  const tagsResponse = await request(app)
    .get('/api/tags')
    .set('Authorization', `Bearer ${authToken}`)
  if (tagsResponse.status === 200 && Array.isArray(tagsResponse.body)) {
    for (const tag of tagsResponse.body) {
      await request(app)
        .delete(`/api/tags/${tag.id}`)
        .set('Authorization', `Bearer ${authToken}`)
    }
  }
}

describe('Tag Update API', () => {
  let authToken: string
  let userId: string

  beforeAll(async () => {
    // Créer un utilisateur de test et obtenir un token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test-update@example.com',
        password: 'password123'
      })

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'test-update@example.com',
      password: 'password123'
    })

    authToken = loginResponse.body.token
    userId = loginResponse.body.user.id
  }, 15000)

  beforeEach(async () => {
    await deleteAllTags(authToken)
  }, 15000)

  afterAll(async () => {
    await Container.getInstance().disconnect()
  }, 15000)

  it('should update a tag successfully', async () => {
    // Créer un tag
    const createResponse = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Original Tag Update Test',
        color: '#FF0000'
      })

    expect(createResponse.status).toBe(201)
    const tagId = createResponse.body.id

    // Mettre à jour le tag
    const updateResponse = await request(app)
      .put(`/api/tags/${tagId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Tag',
        color: '#00FF00'
      })

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.name).toBe('Updated Tag')
    expect(updateResponse.body.color).toBe('#00FF00')
    expect(updateResponse.body.id).toBe(tagId)
    expect(updateResponse.body.userId).toBe(userId)

    // Vérifier que le tag a bien été mis à jour en le récupérant
    const getResponse = await request(app)
      .get('/api/tags')
      .set('Authorization', `Bearer ${authToken}`)

    expect(getResponse.status).toBe(200)
    const updatedTag = getResponse.body.find((tag: any) => tag.id === tagId)
    expect(updatedTag).toBeDefined()
    expect(updatedTag.name).toBe('Updated Tag')
    expect(updatedTag.color).toBe('#00FF00')
  }, 15000)

  it('should reject update with invalid color format', async () => {
    // Créer un tag
    const createResponse = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Tag Color',
        color: '#FF0000'
      })

    const tagId = createResponse.body.id

    // Essayer de mettre à jour avec une couleur invalide
    const updateResponse = await request(app)
      .put(`/api/tags/${tagId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Tag',
        color: 'invalid-color'
      })

    expect(updateResponse.status).toBe(400)
    expect(updateResponse.body.error).toContain('Tag color must be a valid hex color')
  }, 15000)

  it('should reject update with empty name', async () => {
    // Créer un tag
    const createResponse = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Tag Empty',
        color: '#FF0000'
      })

    const tagId = createResponse.body.id

    // Essayer de mettre à jour avec un nom vide
    const updateResponse = await request(app)
      .put(`/api/tags/${tagId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '',
        color: '#FF0000'
      })

    expect(updateResponse.status).toBe(400)
    expect(updateResponse.body.error).toContain('Tag name is required')
  }, 15000)

  it('should reject update with duplicate name', async () => {
    // Créer deux tags
    const tag1Response = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Tag 1 Duplicate',
        color: '#FF0000'
      })

    const tag2Response = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Tag 2 Duplicate',
        color: '#00FF00'
      })

    const tag2Id = tag2Response.body.id

    // Essayer de renommer Tag 2 en "Tag 1 Duplicate" (nom déjà existant)
    const updateResponse = await request(app)
      .put(`/api/tags/${tag2Id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Tag 1 Duplicate',
        color: '#FF0000'
      })

    expect(updateResponse.status).toBe(400)
    expect(updateResponse.body.error).toContain('already exists')
  }, 15000)

  it('should reject update of non-existent tag', async () => {
    const updateResponse = await request(app)
      .put('/api/tags/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Tag',
        color: '#00FF00'
      })

    expect(updateResponse.status).toBe(404)
    expect(updateResponse.body.error).toContain('not found')
  }, 15000)

  it('should reject update without authentication', async () => {
    const updateResponse = await request(app).put('/api/tags/some-id').send({
      name: 'Updated Tag',
      color: '#00FF00'
    })

    expect(updateResponse.status).toBe(401)
  }, 15000)
})
