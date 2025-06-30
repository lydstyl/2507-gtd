import { Router } from 'express'
import { TagController } from '../controllers/tagController'

const router = Router()
const tagController = new TagController()

// GET /api/tags - Get all tags
router.get('/', tagController.getAllTags.bind(tagController))

// POST /api/tags - Create a new tag
router.post('/', tagController.createTag.bind(tagController))

// GET /api/tags/:id - Get a specific tag by ID
router.get('/:id', tagController.getTagById.bind(tagController))

// PUT /api/tags/:id - Update a specific tag
router.put('/:id', tagController.updateTag.bind(tagController))

// DELETE /api/tags/:id - Delete a specific tag
router.delete('/:id', tagController.deleteTag.bind(tagController))

export default router
