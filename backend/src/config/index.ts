import { validateEnvironment, Environment } from './env'

export class Config {
  private static instance: Config
  private _env: Environment

  private constructor() {
    this._env = validateEnvironment()
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config()
    }
    return Config.instance
  }

  get env(): Environment {
    return this._env
  }

  get isDevelopment(): boolean {
    return this._env.NODE_ENV === 'development'
  }

  get isProduction(): boolean {
    return this._env.NODE_ENV === 'production'
  }

  get isTest(): boolean {
    return this._env.NODE_ENV === 'test'
  }
}

export const config = Config.getInstance()
export type { Environment } from './env'