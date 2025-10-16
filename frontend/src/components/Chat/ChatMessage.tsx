import { UIMessage } from 'ai'

interface ChatMessageProps {
  message: UIMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 border border-gray-200'
        }`}
      >
        {message.parts.map((part, index) => {
          switch (part.type) {
            case 'text':
              return (
                <div key={index} className="whitespace-pre-wrap">
                  {part.text}
                </div>
              )

            case 'tool-createTask':
              if (part.state === 'input-streaming' || part.state === 'input-available') {
                return (
                  <div key={index} className="text-sm opacity-75 italic">
                    Creating task: {part.input?.name || '...'}
                  </div>
                )
              }
              if (part.state === 'output-available') {
                return (
                  <div key={index} className="text-sm bg-green-100 text-green-800 rounded p-2 mt-2">
                    ✓ Task created: {part.output?.task?.name}
                  </div>
                )
              }
              if (part.state === 'output-error') {
                return (
                  <div key={index} className="text-sm bg-red-100 text-red-800 rounded p-2 mt-2">
                    ✗ Error: {part.errorText}
                  </div>
                )
              }
              break

            case 'tool-listTasks':
              if (part.state === 'input-streaming' || part.state === 'input-available') {
                return (
                  <div key={index} className="text-sm opacity-75 italic">
                    Fetching tasks...
                  </div>
                )
              }
              if (part.state === 'output-available') {
                const tasks = part.output?.tasks || []
                return (
                  <div key={index} className="text-sm mt-2">
                    <div className="font-semibold mb-2">
                      Found {part.output?.count} tasks:
                    </div>
                    {tasks.length > 0 ? (
                      <ul className="space-y-1">
                        {tasks.map((task: any) => (
                          <li key={task.id} className="flex items-start gap-2">
                            <span className="text-gray-500">•</span>
                            <span>
                              {task.name}
                              {task.plannedDate && (
                                <span className="text-xs ml-2 text-gray-600">
                                  ({task.plannedDate})
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No tasks found.</p>
                    )}
                  </div>
                )
              }
              if (part.state === 'output-error') {
                return (
                  <div key={index} className="text-sm bg-red-100 text-red-800 rounded p-2 mt-2">
                    ✗ Error: {part.errorText}
                  </div>
                )
              }
              break

            default:
              return null
          }
        })}
      </div>
    </div>
  )
}
