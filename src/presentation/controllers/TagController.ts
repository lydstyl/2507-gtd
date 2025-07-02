import { Request, Response } from 'express'
import { CreateTagUseCase } from '../../usecases/tags/CreateTagUseCase'
import { GetAllTagsUseCase } from '../../usecases/tags/GetAllTagsUseCase'

export class TagController {
  constructor(
    private createTagUseCase: CreateTagUseCase,
    private getAllTagsUseCase: GetAllTagsUseCase
  ) {}

  async createTag(req: Request, res: Response): Promise<void> {
    try {
      const tag = await this.createTagUseCase.execute(req.body)
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
      const userId = (req as any).user?.id // Adaptation générique, à ajuster selon ton auth
      const tags = await this.getAllTagsUseCase.execute(userId)
      res.json(tags)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
