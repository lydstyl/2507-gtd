import { SettingRepository } from '../../interfaces/repositories/SettingRepository'

// Valeurs par défaut renvoyées quand une clé est absente de la base.
// `pourIaMaxWords` : nombre de mots max d'une réponse LLM sur une tâche « Pour IA ».
// 50 = défaut demandé par Gabriel (16/11/2026) ; min 10 ; vide/"0" = sans limite.
export const SETTING_DEFAULTS: Record<string, string> = {
  pourIaMaxWords: '50'
}

export class GetSettingsUseCase {
  constructor(private settingRepository: SettingRepository) {}

  async execute(userId: string): Promise<Record<string, string>> {
    const rows = await this.settingRepository.findAll(userId)
    const out: Record<string, string> = { ...SETTING_DEFAULTS }
    for (const row of rows) {
      out[row.key] = row.value
    }
    return out
  }
}
