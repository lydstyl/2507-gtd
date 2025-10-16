import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, isLoading } = useChat({
    transport: new DefaultChatTransport({
      api: `${API_BASE_URL}/api/chat`,
      headers: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No authentication token found in localStorage')
        }
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      },
    }),
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text: string) => {
    sendMessage({ text })
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">Task Assistant</h2>
        <p className="text-sm text-gray-600 mt-1">
          Ask me to create tasks, list your tasks, or help manage your workflow
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">👋 Hello! I'm your GTD task assistant.</p>
              <p className="text-sm">Try asking me to:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• "Create a task to buy groceries tomorrow"</li>
                <li>• "Show me all my tasks"</li>
                <li>• "List tasks due today"</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 text-gray-900 border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}
