import { Router, Request, Response } from 'express'
import { ChatController } from '../controllers/ChatController'
import { authMiddleware } from '../middleware/authMiddleware'

// Friendly label for which LLM the chatbot is currently connected to.
// For the local provider the model is a full GGUF path — show its basename.
function llmLabel(provider: string, model: string): string {
  const name = model ? (model.split('/').pop() || model) : 'modèle inconnu'
  if (provider === 'local') return `local · ${name}`
  return `${provider} · ${name}`
}

export function createChatRoutes(chatController: ChatController): Router {
  const router = Router()

  router.use(authMiddleware)

  // GET /api/chat/llm - Which LLM the chatbot is currently connected to
  router.get('/llm', (_req: Request, res: Response) => {
    const provider = process.env.LLM_PROVIDER || 'anthropic'
    const model = process.env.LLM_MODEL || ''
    const baseURL = process.env.LLM_LOCAL_BASE_URL || ''
    res.json({
      provider,
      model,
      baseURL,
      label: llmLabel(provider, model)
    })
  })

  // POST /api/chat - Stream chat responses with tool calling
  router.post('/', chatController.chat.bind(chatController))

  return router
}
