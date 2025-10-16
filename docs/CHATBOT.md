# GTD Chatbot Feature

## Overview

The GTD app now includes an AI-powered chatbot assistant that allows you to manage tasks using natural language. You can create tasks, list tasks, and get help with your workflow by simply chatting with the assistant.

## Features

- **Natural Language Task Creation**: "Create a task to buy groceries tomorrow"
- **Smart Task Listing**: "Show me all my tasks" or "List tasks due today"
- **Streaming Responses**: Real-time streaming for a smooth conversational experience
- **Tool Call Visualization**: See when the AI is performing actions (creating tasks, fetching data)
- **Multiple LLM Providers**: Choose between Anthropic Claude, OpenAI, or OpenRouter

## Setup

### 1. Configure Environment Variables

Copy the example environment file and configure your LLM provider:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and configure your LLM provider:

```bash
# Choose your provider
LLM_PROVIDER="anthropic"  # Options: anthropic, openai, openrouter

# Add your API key
ANTHROPIC_API_KEY="sk-ant-..."
# OR
# OPENAI_API_KEY="sk-..."
# OR
# OPENROUTER_API_KEY="sk-or-..."

# Optionally specify a model (uses defaults if not set)
# LLM_MODEL="claude-3-5-sonnet-20241022"
```

### 2. Install Dependencies

Dependencies are already installed if you've run `npm install` in the root directory. If not:

```bash
# Root level (installs all workspaces)
npm install

# Or individually
cd backend && npm install
cd frontend && npm install
```

### 3. Start the Application

```bash
# From root directory
npm run dev

# Or individually
cd backend && npm run dev  # Port 3000
cd frontend && npm run dev  # Port 5173
```

### 4. Access the Chat

Navigate to `/chat` in your browser or click the "💬 Chat" link in the navigation header.

## Supported LLM Providers

### Anthropic Claude (Recommended)

Best for conversational AI and tool calling.

- **Default Model**: `claude-3-5-sonnet-20241022`
- **Other Models**: `claude-3-opus-20240229`, `claude-3-haiku-20240307`
- **Get API Key**: [console.anthropic.com](https://console.anthropic.com/)

```bash
LLM_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."
```

### OpenAI

Wide range of GPT models available.

- **Default Model**: `gpt-4o-mini`
- **Other Models**: `gpt-4o`, `gpt-4-turbo`
- **Get API Key**: [platform.openai.com](https://platform.openai.com/)

```bash
LLM_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
```

### OpenRouter

Access to multiple providers through one API.

- **Default Model**: `anthropic/claude-3.5-sonnet`
- **Other Models**: `openai/gpt-4o`, `google/gemini-pro`, and many more
- **Get API Key**: [openrouter.ai](https://openrouter.ai/)

```bash
LLM_PROVIDER="openrouter"
OPENROUTER_API_KEY="sk-or-..."
LLM_MODEL="anthropic/claude-3.5-sonnet"  # Specify model in provider/model format
```

## Usage Examples

### Creating Tasks

```
You: "Create a task to finish the project report by tomorrow"
Assistant: Creates task with name, planned date set to tomorrow

You: "Remind me to call mom next week"
Assistant: Creates task with planned date set to next week

You: "Add a high priority task to review the code"
Assistant: Creates task with high importance
```

### Listing Tasks

```
You: "Show me all my tasks"
Assistant: Lists all active tasks

You: "What tasks are due today?"
Assistant: Lists tasks with today's due date

You: "Show me incomplete tasks"
Assistant: Lists tasks that aren't completed
```

### General Assistance

```
You: "What can you help me with?"
Assistant: Explains available capabilities

You: "How do I organize my tasks?"
Assistant: Provides GTD workflow guidance
```

## Architecture

The chatbot follows the Clean Architecture principles used throughout the GTD app:

### Backend

```
backend/src/
├── usecases/chat/
│   └── ChatUseCase.ts           # Main chatbot logic with tool definitions
├── infrastructure/ai/
│   └── LLMProviderFactory.ts    # Factory for creating LLM providers
├── presentation/
│   ├── controllers/
│   │   └── ChatController.ts    # HTTP endpoint for chat streaming
│   └── routes/
│       └── chatRoutes.ts        # Chat route definitions
```

### Frontend

```
frontend/src/
├── components/Chat/
│   ├── ChatInterface.tsx        # Main chat UI component
│   ├── ChatMessage.tsx          # Individual message rendering
│   └── ChatInput.tsx            # User input component
├── pages/
│   └── ChatPage.tsx             # Chat page wrapper
```

## Tools Available to the AI

The chatbot has access to the following tools:

### createTask

Creates a new task in the GTD system.

**Parameters:**
- `name` (required): Task name or description
- `importance` (optional): 0-5, where 0 means uncategorized (default: 0)
- `complexity` (optional): 1-9 (default: 3)
- `plannedDate` (optional): When to do the task (ISO date)
- `dueDate` (optional): Task deadline (ISO date)
- `note` (optional): Additional notes

### listTasks

Lists and filters tasks from the GTD system.

**Parameters:**
- `isCompleted` (optional): Filter by completion status
- `plannedDate` (optional): Filter by planned date
- `dueDate` (optional): Filter by due date
- `limit` (optional): Maximum number of tasks to return (default: 20)

## Extending the Chatbot

### Adding New Tools

To add new capabilities to the chatbot:

1. **Add the tool in ChatUseCase.ts**:

```typescript
// backend/src/usecases/chat/ChatUseCase.ts
tools: {
  // ... existing tools
  completeTask: tool({
    description: 'Mark a task as completed',
    inputSchema: z.object({
      taskId: z.string().describe('The ID of the task to complete'),
    }),
    execute: async ({ taskId }) => {
      // Use existing use case
      const result = await this.markTaskAsCompletedUseCase.execute({
        taskId,
        userId
      })
      return result
    }
  })
}
```

2. **Handle the tool in ChatMessage.tsx**:

```typescript
// frontend/src/components/Chat/ChatMessage.tsx
case 'tool-completeTask':
  if (part.state === 'output-available') {
    return (
      <div className="text-sm bg-green-100 text-green-800 rounded p-2 mt-2">
        ✓ Task completed
      </div>
    )
  }
  break
```

### Adding New LLM Providers

To add support for a new LLM provider:

1. **Update LLMProviderFactory.ts**:

```typescript
// backend/src/infrastructure/ai/LLMProviderFactory.ts
case 'newprovider': {
  const modelName = model || 'default-model'
  if (!apiKey) {
    throw new Error('NEW_PROVIDER_API_KEY is required')
  }
  return customProvider(modelName, { apiKey })
}
```

2. **Update environment configuration**:

Add the new provider option to `.env.example`.

## Troubleshooting

### Chat not working

1. **Check environment variables**: Ensure your `.env` file has the correct `LLM_PROVIDER` and corresponding API key
2. **Check authentication**: You must be logged in to use the chat
3. **Check network**: Ensure the backend is running on port 3000
4. **Check console**: Look for errors in the browser console and backend logs

### Slow responses

- Consider using a faster model (e.g., `claude-3-haiku-20240307` or `gpt-4o-mini`)
- Check your internet connection
- Verify your API provider status

### API errors

- **401 Unauthorized**: Check that your API key is valid and properly formatted
- **429 Rate Limited**: You've exceeded your provider's rate limits
- **500 Server Error**: Check backend logs for detailed error messages

## Future Enhancements

Potential improvements to the chatbot:

- [ ] Task updates and deletion via chat
- [ ] Bulk task operations
- [ ] Task search and filtering
- [ ] Natural language date parsing improvements
- [ ] Context-aware suggestions
- [ ] Task templates
- [ ] Voice input support
- [ ] Multi-language support

## Security Considerations

- API keys are stored in environment variables and never exposed to the frontend
- All chat requests require authentication via JWT tokens
- User data is isolated - the chatbot can only access tasks for the authenticated user
- LLM responses are not stored - conversations are ephemeral

## Contributing

When adding new features to the chatbot:

1. Follow the existing Clean Architecture pattern
2. Add comprehensive error handling
3. Update this documentation
4. Write tests for new use cases
5. Update the `.env.example` file if adding new configuration

## Support

For issues or questions:

1. Check the [main README](./README.md)
2. Review the [CLAUDE.md](./CLAUDE.md) development guidelines
3. Open an issue on GitHub
