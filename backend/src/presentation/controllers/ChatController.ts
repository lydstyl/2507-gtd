import { Request, Response } from 'express'
import { ChatUseCase } from '../../usecases/chat/ChatUseCase'
import { chatLogger } from '../../infrastructure/logger/Logger'

export class ChatController {
  constructor(private chatUseCase: ChatUseCase) {}

  // Helper to convert UIMessage format to simple format
  private convertUIMessagesToSimple(messages: any[]): Array<{ role: 'user' | 'assistant', content: string }> {
    return messages.map(msg => {
      // If message already has role and content (simple format), use it as-is
      if (msg.role && msg.content && typeof msg.content === 'string') {
        return { role: msg.role, content: msg.content }
      }

      // If message has parts (UIMessage format), extract text from parts
      if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('\n')

        return {
          role: msg.role || 'user',
          content: textParts || ''
        }
      }

      // Fallback: treat the whole message as content
      return {
        role: msg.role || 'user',
        content: String(msg.content || msg.text || '')
      }
    })
  }

  chat = async (req: Request, res: Response): Promise<void> => {
    const requestId = Math.random().toString(36).substring(7)

    try {
      chatLogger.info(`[${requestId}] Chat request received`, {
        method: req.method,
        path: req.path,
        hasAuth: !!req.headers.authorization
      })

      const { messages } = req.body
      const userId = (req as any).user?.userId

      chatLogger.debug(`[${requestId}] Request details`, {
        messagesCount: messages?.length,
        userId: userId || 'MISSING',
        firstMessage: messages?.[0]
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

      // Convert UIMessage format to simple format
      const simpleMessages = this.convertUIMessagesToSimple(messages)

      chatLogger.debug(`[${requestId}] Converted messages`, {
        original: messages.length,
        converted: simpleMessages.length,
        sample: simpleMessages[0]
      })

      chatLogger.info(`[${requestId}] Executing ChatUseCase`)
      // Execute chat use case with streaming
      const result = await this.chatUseCase.execute({
        messages: simpleMessages,
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
      chatLogger.error(`[${requestId}] Chat error`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        errorDetails: error
      })
      if (!res.headersSent) {
        res.status(500).json({
          error: 'An error occurred while processing your request',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }
}
