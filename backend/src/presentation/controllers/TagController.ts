import { Request, Response } from 'express'
import { CreateTagUseCase } from '../../usecases/tags/CreateTagUseCase'
import { GetAllTagsUseCase } from '../../usecases/tags/GetAllTagsUseCase'
import { DeleteTagUseCase } from '../../usecases/tags/DeleteTagUseCase'
import { UpdateTagUseCase } from '../../usecases/tags/UpdateTagUseCase'
import { UpdateTagPositionsUseCase } from '../../usecases/tags/UpdateTagPositionsUseCase'

export class TagController {
  constructor(
    private createTagUseCase: CreateTagUseCase,
    private getAllTagsUseCase: GetAllTagsUseCase,
    private deleteTagUseCase: DeleteTagUseCase,
    private updateTagUseCase: UpdateTagUseCase,
    private updateTagPositionsUseCase: UpdateTagPositionsUseCase
  ) {}

  async createTag(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      const tagData = { ...req.body, userId }
      const tag = await this.createTagUseCase.execute(tagData)
      res.status(201).json(tag)
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async getAllTags(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      const tags = await this.getAllTagsUseCase.execute(userId)
      res.json(tags)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async deleteTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      await this.deleteTagUseCase.execute(id, userId)
      res.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async updateTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const tagData = req.body
      const tag = await this.updateTagUseCase.execute(id, tagData, userId)
      res.json(tag)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async updateTagPositions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const { tagPositions } = req.body
      await this.updateTagPositionsUseCase.execute(tagPositions, userId)
      res.status(200).json({ message: 'Tag positions updated successfully' })
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
}
