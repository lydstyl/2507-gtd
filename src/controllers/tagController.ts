import { Request, Response } from 'express'
import { TagService } from '../services/tagService'
import { CreateTagRequest, UpdateTagRequest } from '../types'

const tagService = new TagService()

export class TagController {
  async createTag(req: Request, res: Response): Promise<void> {
    try {
      const tagData: CreateTagRequest = req.body
      const tag = await tagService.createTag(tagData)
      res.status(201).json(tag)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async getTagById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const tag = await tagService.getTagById(id)

      if (!tag) {
        res.status(404).json({ error: 'Tag not found' })
        return
      }

      res.json(tag)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getAllTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await tagService.getAllTags()
      res.json(tags)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async updateTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const tagData: UpdateTagRequest = req.body
      const tag = await tagService.updateTag(id, tagData)
      res.json(tag)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async deleteTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await tagService.deleteTag(id)
      res.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async getTagsByTaskId(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params
      const tags = await tagService.getTagsByTaskId(taskId)
      res.json(tags)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
