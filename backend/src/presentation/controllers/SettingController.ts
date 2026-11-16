import { Request, Response } from 'express'
import { GetSettingsUseCase } from '../../usecases/settings/GetSettingsUseCase'
import { UpdateSettingsUseCase } from '../../usecases/settings/UpdateSettingsUseCase'

export class SettingController {
  constructor(
    private getSettingsUseCase: GetSettingsUseCase,
    private updateSettingsUseCase: UpdateSettingsUseCase
  ) {}

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      const settings = await this.getSettingsUseCase.execute(userId)
      res.json(settings)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
      const settings = await this.updateSettingsUseCase.execute(userId, body)
      res.json(settings)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
