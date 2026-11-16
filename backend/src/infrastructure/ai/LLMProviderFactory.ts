import { LanguageModel } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai, createOpenAI } from '@ai-sdk/openai'

export type LLMProviderType = 'anthropic' | 'openai' | 'openrouter' | 'local'

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
        const modelName = model || 'deepseek/deepseek-v4-flash'
        // OpenRouter uses OpenAI-compatible chat completions API
        // Use .chat() to force chat completions endpoint instead of responses
        const openrouter = createOpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: process.env.OPENROUTER_API_KEY,
          headers: {
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'GTD Task Manager'
          }
        })
        // Use .chat() to explicitly use chat completions endpoint
        return openrouter.chat(modelName)
      }

      case 'local': {
        // LLM local llama.cpp (API OpenAI-compatible, ex. PC Marie 192.168.3.57:8080)
        // LLM_LOCAL_BASE_URL : ex. http://192.168.3.57:8080/v1
        // LLM_MODEL          : nom exact du modèle servi (voir GET /v1/models)
        const baseURL = process.env.LLM_LOCAL_BASE_URL || 'http://192.168.3.57:8080/v1'
        const local = createOpenAI({
          baseURL,
          apiKey: 'local' // llama.cpp n'exige pas de clé
        })
        if (!model) {
          throw new Error('LLM_MODEL is required for the local provider (nom exact du modèle servi, voir GET <LLM_LOCAL_BASE_URL>/models)')
        }
        // .chat() = endpoint chat completions (tool calling inclus)
        return local.chat(model)
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
        break
      case 'local':
        // Pas de clé : llama.cpp. LLM_MODEL obligatoire (nom exact du modèle servi).
        if (!process.env.LLM_MODEL) {
          throw new Error('LLM_MODEL environment variable is required for local provider (nom exact du modèle servi)')
        }
        break
    }

    return this.createProvider({ provider, model })
  }
}
