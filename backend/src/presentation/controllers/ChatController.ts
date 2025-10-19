import { Request, Response } from 'express'
import { ChatUseCase } from '../../usecases/chat/ChatUseCase'
import { convertToModelMessages, UIMessage } from 'ai'
import { chatLogger } from '../../infrastructure/logger/Logger'

export class ChatController {
  constructor(private chatUseCase: ChatUseCase) {}

  chat = async (req: Request, res: Response): Promise<void> => {
    const requestId = Math.random().toString(36).substring(7)

    try {
      chatLogger.info(`[${requestId}] Chat request received`, {
        method: req.method,
        path: req.path,
        hasAuth: !!req.headers.authorization
      })

      const { messages }: { messages: UIMessage[] } = req.body
      const userId = (req as any).user?.userId

      chatLogger.debug(`[${requestId}] Request details`, {
        messagesCount: messages?.length,
        userId: userId || 'MISSING'
      })

      if (!messages || !Array.isArray(messages)) {
        chatLogger.warn(`[${requestId}] Invalid messages array`)
        res.status(400).json({
          error: 'Messages array is required'
        })
        return
      }

      if (!userId) {
        chatLogger.error(`[${requestId}] User not authenticated`, {
          hasUser: !!(req as any).user,
          userKeys: Object.keys((req as any).user || {})
        })
        res.status(401).json({
          error: 'User not authenticated'
        })
        return
      }

      chatLogger.info(`[${requestId}] Converting messages to model format`)
      // Convert UI messages to model messages format
      const modelMessages = convertToModelMessages(messages)

      chatLogger.info(`[${requestId}] Executing ChatUseCase`)
      // Execute chat use case with streaming
      const result = await this.chatUseCase.execute({
        messages: modelMessages as Array<{
          role: 'user' | 'assistant'
          content: string
        }>,
        userId
      })

      chatLogger.info(`[${requestId}] Starting stream response`)
      // Stream the response back to the client
      const response = result.toUIMessageStreamResponse()

      // Copy headers from the stream response
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })

      // Set the status code
      res.status(response.status || 200)

      chatLogger.debug(`[${requestId}] Headers set, beginning stream pump`)

      // Pipe the stream to the response
      if (response.body) {
        const reader = response.body.getReader()
        let chunkCount = 0
        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read()
          if (done) {
            chatLogger.info(`[${requestId}] Stream completed`, { chunkCount })
            res.end()
            return
          }
          chunkCount++
          if (chunkCount % 10 === 0) {
            chatLogger.debug(`[${requestId}] Streaming chunk ${chunkCount}`)
          }
          res.write(value)
          return pump()
        }
        await pump()
      } else {
        chatLogger.warn(`[${requestId}] No response body to stream`)
        res.end()
      }
    } catch (error) {
      chatLogger.error(`[${requestId}] Chat error`, error)
      if (!res.headersSent) {
        res.status(500).json({
          error: 'An error occurred while processing your request'
        })
      }
    }
  }
}
