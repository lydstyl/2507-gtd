import { Router } from 'express'
import { ChatController } from '../controllers/ChatController'
import { authMiddleware } from '../middleware/authMiddleware'

export function createChatRoutes(chatController: ChatController): Router {
  const router = Router()

  router.use(authMiddleware)

  // POST /api/chat - Stream chat responses with tool calling
  router.post('/', chatController.chat.bind(chatController))

  return router
}
