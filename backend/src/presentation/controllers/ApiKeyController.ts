import { Request, Response } from 'express'
import { z } from 'zod'
import { CreateApiKeyUseCase } from '../../usecases/apikeys/CreateApiKeyUseCase'
import { ListApiKeysUseCase } from '../../usecases/apikeys/ListApiKeysUseCase'
import { RevokeApiKeyUseCase } from '../../usecases/apikeys/RevokeApiKeyUseCase'
import { RegenerateApiKeyUseCase } from '../../usecases/apikeys/RegenerateApiKeyUseCase'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
})

export class ApiKeyController {
  constructor(
    private createUseCase: CreateApiKeyUseCase,
    private listUseCase: ListApiKeysUseCase,
    private revokeUseCase: RevokeApiKeyUseCase,
    private regenerateUseCase: RegenerateApiKeyUseCase
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.userId
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }
    const keys = await this.listUseCase.execute(userId)
    res.json(keys)
  }

  async create(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.userId
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' })
      return
    }

    const result = await this.createUseCase.execute({
      userId,
      name: parsed.data.name,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    })

    res.status(201).json(result)
  }

  async revoke(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.userId
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const deleted = await this.revokeUseCase.execute(req.params.id, userId)
    if (!deleted) {
      res.status(404).json({ error: 'API key not found' })
      return
    }

    res.status(204).send()
  }

  async regenerate(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.userId
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const result = await this.regenerateUseCase.execute(req.params.id, userId)
    if (!result) {
      res.status(404).json({ error: 'API key not found' })
      return
    }

    res.status(201).json(result)
  }
}
