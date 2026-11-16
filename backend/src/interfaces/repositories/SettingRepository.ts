import { Setting } from '../../domain/entities/Setting'

export interface SettingRepository {
  findAll(userId: string): Promise<Setting[]>
  findByKey(userId: string, key: string): Promise<Setting | null>
  upsert(userId: string, key: string, value: string): Promise<Setting>
}
