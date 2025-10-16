import { LanguageModel } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'

export type LLMProviderType = 'anthropic' | 'openai' | 'openrouter'

export interface LLMConfig {
  provider: LLMProviderType
  model?: string
  apiKey?: string
}

export class LLMProviderFactory {
  static createProvider(config: LLMConfig): LanguageModel {
    const { provider, model } = config

    switch (provider) {
      case 'anthropic': {
        const modelName = model || 'claude-3-5-sonnet-20241022'
        // API key should be set in ANTHROPIC_API_KEY environment variable
        return anthropic(modelName)
      }

      case 'openai': {
        const modelName = model || 'gpt-4o-mini'
        // API key should be set in OPENAI_API_KEY environment variable
        return openai(modelName)
      }

      case 'openrouter': {
        const modelName = model || 'anthropic/claude-3.5-sonnet'
        // OpenRouter uses OPENAI_API_KEY environment variable
        // Set baseURL to OpenRouter's endpoint
        return openai(modelName)
      }

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`)
    }
  }

  static createFromEnv(): LanguageModel {
    const provider = (process.env.LLM_PROVIDER || 'anthropic') as LLMProviderType
    const model = process.env.LLM_MODEL

    // Validate that API keys are set
    switch (provider) {
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY environment variable is required for Anthropic provider')
        }
        break
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY environment variable is required for OpenAI provider')
        }
        break
      case 'openrouter':
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error('OPENROUTER_API_KEY environment variable is required for OpenRouter provider')
        }
        // For OpenRouter, we need to set OPENAI_API_KEY to OPENROUTER_API_KEY
        process.env.OPENAI_API_KEY = process.env.OPENROUTER_API_KEY
        break
    }

    return this.createProvider({ provider, model })
  }
}
