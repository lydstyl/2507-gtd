import { SettingRepository } from '../../interfaces/repositories/SettingRepository'
import { SETTING_DEFAULTS } from './GetSettingsUseCase'

// Validation minimale côté serveur : pour les clés numériques connues, on refuse
// la vide et on borne à min 10 (contrat UI). On ne stocke que des valeurs propres.
function cleanValue(key: string, raw: unknown): string | null {
  const s = String(raw ?? '').trim()
  if (key === 'pourIaMaxWords') {
    if (s === '' || /^(0|sans|unlimited|sanslimite|null)$/i.test(s)) return '' // sans limite
    const n = Number(s)
    if (!Number.isFinite(n)) return null // invalide → ignoré
    if (n < 10) return null // sous le minimum 10 → refusé
    return String(Math.floor(n))
  }
  return s
}

export class UpdateSettingsUseCase {
  constructor(private settingRepository: SettingRepository) {}

  async execute(userId: string, settings: Record<string, unknown>): Promise<Record<string, string>> {
    for (const [key, raw] of Object.entries(settings || {})) {
      const clean = cleanValue(key, raw)
      if (clean === null) continue // valeur invalide pour cette clé → ignorée
      await this.settingRepository.upsert(userId, key, clean)
    }

    const rows = await this.settingRepository.findAll(userId)
    const out: Record<string, string> = { ...SETTING_DEFAULTS }
    for (const row of rows) {
      out[row.key] = row.value
    }
    return out
  }
}
