import { Request, Response } from 'express'
import { ChatUseCase } from '../../usecases/chat/ChatUseCase'
import { convertToModelMessages, UIMessage } from 'ai'

export class ChatController {
  constructor(private chatUseCase: ChatUseCase) {}

  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messages }: { messages: UIMessage[] } = req.body
      const userId = (req as any).user?.userId

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({
          error: 'Messages array is required'
        })
        return
      }

      if (!userId) {
        res.status(401).json({
          error: 'User not authenticated'
        })
        return
      }

      // Convert UI messages to model messages format
      const modelMessages = convertToModelMessages(messages)

      // Execute chat use case with streaming
      const result = await this.chatUseCase.execute({
        messages: modelMessages as Array<{
          role: 'user' | 'assistant'
          content: string
        }>,
        userId
      })

      // Stream the response back to the client
      const response = result.toUIMessageStreamResponse()

      // Copy headers from the stream response
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })

      // Set the status code
      res.status(response.status || 200)

      // Pipe the stream to the response
      if (response.body) {
        const reader = response.body.getReader()
        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read()
          if (done) {
            res.end()
            return
          }
          res.write(value)
          return pump()
        }
        await pump()
      } else {
        res.end()
      }
    } catch (error) {
      console.error('Chat error:', error)
      if (!res.headersSent) {
        res.status(500).json({
          error: 'An error occurred while processing your request'
        })
      }
    }
  }
}
