# AI-Driven Development Guide: GTD Chatbot

## Table of Contents

1. [Overview](#overview)
2. [How the GTD Chatbot Works](#how-the-gtd-chatbot-works)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [AI-Driven Development Concepts](#ai-driven-development-concepts)
5. [MCP Server Integration](#mcp-server-integration)
6. [Available Features](#available-features)
7. [Implementation Details](#implementation-details)
8. [Becoming an AI-Driven Developer](#becoming-an-ai-driven-developer)
9. [Best Practices](#best-practices)
10. [Next Steps & Extensions](#next-steps--extensions)

---

## Overview

The GTD (Getting Things Done) application includes an AI-powered chatbot that allows users to manage their tasks and tags using natural language. Instead of clicking through UI forms, users can simply type commands like "Create a task to buy milk tomorrow" or "Show me all my high-priority tasks."

This guide explains:
- How the chatbot works technically
- What AI-driven development means
- How to leverage AI tools in your development workflow
- Best practices for building AI-powered applications

---

## How the GTD Chatbot Works

### High-Level Flow

```
User Input → Frontend (React) → Backend API → LLM (Claude/GPT) → Tool Calling → Database → Response
```

### Step-by-Step Breakdown

1. **User sends a message** via the chat interface (e.g., "Create a task to review PR #123")

2. **Frontend sends POST request** to `/api/chat` with the message history
   - Uses Vercel AI SDK's `useChat` hook
   - Handles streaming responses from the backend
   - Displays tool execution states in real-time

3. **Backend receives the request** in `ChatController`
   - Validates authentication (JWT token)
   - Extracts user ID from the authenticated session
   - Converts UI message format to simple format

4. **ChatUseCase orchestrates the AI interaction**
   - Calls the LLM (Claude 3.5 Sonnet, GPT-4, or others via OpenRouter)
   - Provides system prompt explaining available capabilities
   - Defines 9 tools for task and tag management

5. **LLM processes the user's intent**
   - Analyzes the natural language input
   - Determines which tool(s) to call
   - Extracts parameters from the user's message
   - Returns tool calls with proper parameters

6. **Backend executes the tool functions**
   - Each tool calls the corresponding Use Case (e.g., `CreateTaskUseCase`)
   - Use cases interact with repositories to modify the database
   - Results are returned to the LLM

7. **LLM generates a response**
   - Interprets the tool results
   - Crafts a natural language response
   - Streams the response back to the frontend

8. **Frontend displays the response**
   - Shows streaming text as it arrives
   - Displays tool execution states (input-streaming, output-available, error)
   - Updates the UI with visual feedback (success/error indicators)

---

## Architecture & Technology Stack

### Backend Stack

- **Framework**: Express.js with TypeScript
- **AI SDK**: Vercel AI SDK (`ai` package)
- **LLM Providers**:
  - Anthropic (Claude 3.5 Sonnet) - Primary
  - OpenAI (GPT-4)
  - OpenRouter (access to multiple models)
- **Architecture**: Clean Architecture
  - Domain Layer (entities, business rules)
  - Use Cases Layer (application logic)
  - Infrastructure Layer (repositories, adapters)
  - Presentation Layer (controllers, routes)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)

### Frontend Stack

- **Framework**: React with TypeScript
- **AI Hook**: `useChat` from `ai/react`
- **Styling**: Tailwind CSS
- **State Management**: React hooks + TanStack Query

### Key Files

**Backend:**
- `/backend/src/usecases/chat/ChatUseCase.ts` - Core chatbot logic with tool definitions
- `/backend/src/presentation/controllers/ChatController.ts` - HTTP endpoint handler
- `/backend/src/infrastructure/llm/LLMProviderFactory.ts` - LLM provider abstraction
- `/backend/src/presentation/routes/chatRoutes.ts` - API route configuration

**Frontend:**
- `/frontend/src/components/Chat/ChatInterface.tsx` - Main chat UI component
- `/frontend/src/components/Chat/ChatMessage.tsx` - Message rendering with tool states
- `/frontend/src/pages/ChatPage.tsx` - Chat page layout

---

## AI-Driven Development Concepts

### What is AI-Driven Development?

AI-driven development is an approach where AI tools assist developers throughout the software development lifecycle:

1. **Code Generation**: AI writes boilerplate code, implements features
2. **Code Completion**: AI suggests completions as you type
3. **Code Review**: AI identifies bugs, security issues, style violations
4. **Documentation**: AI generates docs from code
5. **Testing**: AI writes test cases
6. **Refactoring**: AI suggests improvements and performs refactoring
7. **User Interaction**: AI-powered features like chatbots, recommendations

### Tool Calling (Function Calling)

The chatbot uses **tool calling**, a powerful LLM capability where:

1. You define functions (tools) the AI can call
2. You provide schemas describing parameters
3. The AI decides when to call each tool based on user input
4. The AI extracts parameters from natural language
5. Your backend executes the function with those parameters
6. Results are sent back to the AI for response generation

**Example:**

```typescript
createTask: tool({
  description: 'Create a new task in the GTD system',
  inputSchema: z.object({
    name: z.string().describe('The task name'),
    importance: z.number().min(0).max(5).optional(),
    dueDate: z.string().optional()
  }),
  execute: async ({ name, importance, dueDate }) => {
    // Execute task creation
    const result = await this.createTaskUseCase.execute({
      name, importance, dueDate, userId
    })
    return result
  }
})
```

When a user says "Create a task to review PR with high importance due tomorrow", the AI:
- Detects the need to call `createTask`
- Extracts: `name: "review PR"`, `importance: 5`, `dueDate: "2025-10-20"`
- Returns a tool call request
- Backend executes the function
- AI generates: "✓ I've created a high-importance task 'review PR' due tomorrow."

### Prompt Engineering

The **system prompt** is crucial for guiding the AI's behavior:

```typescript
system: `You are a helpful task management assistant for a GTD application.
You can help users manage tasks and tags with full CRUD operations.

TASK MANAGEMENT:
- Create tasks with name, importance (0-5), complexity (1-9), dates, links, notes, and tags
- List and filter tasks by various criteria
- Update any task property
- Mark tasks as completed
- Delete tasks

When parsing dates:
- Parse naturally (e.g., "tomorrow", "next week", "Monday", "2024-12-25")
- plannedDate = when to start the task
- dueDate = deadline for the task

Be concise, helpful, and action-oriented.`
```

This prompt:
- Defines the AI's role and capabilities
- Explains business rules (date formats, importance ranges)
- Sets the tone (concise, action-oriented)
- Provides context the AI needs to make decisions

---

## MCP Server Integration

### What is MCP?

**MCP (Model Context Protocol)** is an open protocol by Anthropic that allows AI assistants to integrate with external tools and data sources. It provides a standardized way for LLMs to:

- Read files and databases
- Execute commands
- Access APIs
- Use custom tools

### Is This Application Using MCP?

**No, this GTD chatbot does not use MCP directly.** Instead, it uses:

1. **Vercel AI SDK** - Provides tool calling abstraction that works with multiple LLM providers
2. **Custom tool definitions** - Tools are defined directly in the backend code
3. **HTTP API** - Tools execute backend Use Cases via standard function calls

### MCP vs. This Implementation

| Aspect | MCP | This App |
|--------|-----|----------|
| **Protocol** | Standardized protocol | Custom HTTP API |
| **Tool Discovery** | Dynamic tool registration | Static tool definitions |
| **Providers** | Claude Desktop, others | Any LLM via AI SDK |
| **Deployment** | Requires MCP server | Standard web server |
| **Flexibility** | Can use external tools | Backend-only tools |

### When to Use MCP

Consider MCP when you want to:
- Build desktop AI assistants with file system access
- Share tools across multiple AI applications
- Provide external developers access to your tools
- Integrate with Claude Desktop or other MCP clients

### When to Use Custom Tool Calling (Like This App)

This approach is better when you want to:
- Build web applications with embedded AI
- Full control over tool execution and security
- Work with multiple LLM providers
- Keep all logic within your application

---

## Available Features

### Task Management (5 Tools)

#### 1. Create Task
**Command examples:**
- "Create a task to buy milk"
- "Add a task: Review PR #123 with high importance"
- "Create a task to deploy backend tomorrow with complexity 7"
- "Add task: Research competitors with link https://example.com"

**Parameters:**
- `name` (required): Task description
- `importance` (0-5, optional): Priority level (default: 0)
- `complexity` (1-9, optional): Difficulty level (default: 3)
- `plannedDate` (optional): When to do it (YYYY-MM-DD)
- `dueDate` (optional): Deadline (YYYY-MM-DD)
- `link` (optional): Related URL
- `note` (optional): Additional details
- `tagIds` (optional): Array of tag IDs

#### 2. List Tasks
**Command examples:**
- "Show me my tasks"
- "List all high-importance tasks"
- "Show tasks with complexity 5 or higher"
- "What tasks do I have?"

**Parameters:**
- `importance` (optional): Filter by importance (0-5)
- `complexity` (optional): Filter by complexity (1-9)
- `search` (optional): Search by task name
- `limit` (optional): Max results (default: 20)

#### 3. Update Task
**Command examples:**
- "Change task [id] importance to 5"
- "Update task [id] due date to next Monday"
- "Add link https://example.com to task [id]"
- "Change task [id] name to 'Deploy production'"

**Parameters:**
- `taskId` (required): Task identifier
- `name` (optional): New task name
- `importance` (optional): New importance (0-5)
- `complexity` (optional): New complexity (1-9)
- `plannedDate` (optional): New start date
- `dueDate` (optional): New deadline
- `link` (optional): New link
- `note` (optional): New notes
- `tagIds` (optional): New tag array

#### 4. Mark Task Completed
**Command examples:**
- "Mark task [id] as done"
- "Complete task [id]"
- "I finished task [id]"

**Parameters:**
- `taskId` (required): Task to complete

#### 5. Delete Task
**Command examples:**
- "Delete task [id]"
- "Remove task [id]"
- "Get rid of task [id]"

**Parameters:**
- `taskId` (required): Task to delete

### Tag Management (4 Tools)

#### 6. Create Tag
**Command examples:**
- "Create a tag called 'work'"
- "Add a tag 'urgent' with red color"
- "Make a tag 'personal' with color #3B82F6"

**Parameters:**
- `name` (required): Tag name
- `color` (optional): Hex color code (default: #6366F1)

#### 7. List Tags
**Command examples:**
- "Show my tags"
- "What tags do I have?"
- "List all tags"

**Parameters:** None

#### 8. Update Tag
**Command examples:**
- "Rename tag [id] to 'work-important'"
- "Change tag [id] color to #FF0000"

**Parameters:**
- `tagId` (required): Tag identifier
- `name` (optional): New tag name
- `color` (optional): New hex color

#### 9. Delete Tag
**Command examples:**
- "Delete tag [id]"
- "Remove tag [id]"

**Parameters:**
- `tagId` (required): Tag to delete

---

## Implementation Details

### Streaming Response

The chatbot uses Server-Sent Events (SSE) for real-time streaming:

```typescript
// Backend: ChatController.ts
const result = this.chatUseCase.execute({ messages, userId })
const response = result.toUIMessageStreamResponse()

// Stream to client
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
```

```typescript
// Frontend: ChatInterface.tsx
const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  headers: { Authorization: `Bearer ${token}` }
})
```

### Tool State Visualization

The frontend shows tool execution in real-time:

```typescript
// ChatMessage.tsx
{message.parts.map((part, index) => {
  switch (part.type) {
    case 'tool-createTask':
      if (part.state === 'input-streaming') {
        return <div>Creating task: {part.input?.name}</div>
      }
      if (part.state === 'output-available') {
        return <div>✓ Task created: {part.output?.task?.name}</div>
      }
      if (part.state === 'output-error') {
        return <div>✗ Error: {part.errorText}</div>
      }
  }
})}
```

States:
- `input-streaming`: AI is generating tool parameters
- `input-available`: Parameters ready, waiting for execution
- `output-streaming`: Tool is executing (not used in this app)
- `output-available`: Tool completed successfully
- `output-error`: Tool failed

### Error Handling

Comprehensive error handling at multiple levels:

```typescript
// ChatController.ts - HTTP level
try {
  const result = this.chatUseCase.execute({ messages, userId })
  // ... stream response
} catch (error) {
  if (!res.headersSent) {
    res.status(500).json({ error: 'An error occurred' })
  }
}

// ChatUseCase.ts - Tool level
execute: async ({ name, importance }) => {
  try {
    const result = await this.createTaskUseCase.execute({ ... })
    if (result.success) {
      return { success: true, task: result.data }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task'
    }
  }
}
```

### Authentication & Security

All chat requests require authentication:

```typescript
// backend/src/presentation/middleware/authMiddleware.ts
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

All database operations are scoped to the authenticated user:

```typescript
// All tools receive userId
const result = await this.createTaskUseCase.execute({
  name,
  userId,  // ← Ensures user isolation
  ...
})
```

---

## Becoming an AI-Driven Developer

### 1. Master Prompt Engineering

**Skills to develop:**
- Writing clear, specific system prompts
- Providing context and examples
- Defining tool schemas with detailed descriptions
- Iterating on prompts based on AI behavior

**Practice:**
- Experiment with different system prompt formulations
- Use few-shot learning (provide examples in the prompt)
- Test edge cases and refine prompts accordingly

### 2. Understand AI SDKs

**Learn these tools:**
- **Vercel AI SDK** - Multi-provider abstraction (current app)
- **LangChain** - Complex AI workflows, chains, agents
- **LlamaIndex** - RAG (Retrieval-Augmented Generation)
- **Anthropic SDK** - Direct Claude API access
- **OpenAI SDK** - Direct GPT API access

**Practice:**
- Build small projects with each SDK
- Compare tool calling implementations
- Explore streaming, function calling, embeddings

### 3. Design AI-Friendly Architectures

**Principles:**
- **Separation of concerns**: Keep AI logic separate from business logic
- **Tool-oriented design**: Structure code around discrete, callable functions
- **Clear contracts**: Define explicit input/output schemas
- **Error resilience**: Handle AI errors gracefully (malformed responses, hallucinations)

**Example:**
```
✅ Good: AI calls CreateTaskUseCase → Use case validates → Repository saves
❌ Bad: AI directly writes SQL queries
```

### 4. Testing AI Features

**Strategies:**
- **Unit tests for tools**: Test tool functions independently
- **Integration tests**: Test AI + tool execution together
- **Prompt testing**: Test how AI interprets various user inputs
- **Regression tests**: Capture failing cases and add to test suite

```typescript
// Example integration test
describe('Chat - Create Task', () => {
  it('should create a task from natural language', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        messages: [{ role: 'user', content: 'Create a task to buy milk' }]
      })

    expect(response.status).toBe(200)
    // Verify task was created in database
  })
})
```

### 5. Stay Updated

AI is evolving rapidly. Follow:
- **AI SDK releases**: Vercel AI SDK, LangChain updates
- **LLM announcements**: Claude, GPT, Llama releases
- **Best practices**: AI engineering blogs, papers
- **Community**: Discord servers, GitHub discussions

**Resources:**
- Vercel AI SDK docs: https://sdk.vercel.ai/docs
- Anthropic docs: https://docs.anthropic.com/
- OpenAI docs: https://platform.openai.com/docs
- LangChain: https://python.langchain.com/docs/
- AI Engineer newsletter, community

### 6. Build AI-First Products

**Shift your mindset:**
- **Before AI**: "How can I build a form for this?"
- **With AI**: "How can users accomplish this with natural language?"

**Examples:**
- ✅ Chatbot for task management (this app)
- ✅ AI code review assistant
- ✅ Automated customer support
- ✅ Intelligent search
- ✅ Content generation tools

---

## Best Practices

### 1. System Prompt Design

```typescript
// ✅ Good: Clear, structured, specific
system: `You are a task management assistant.

CAPABILITIES:
- Create tasks with name, importance (0-5), complexity (1-9)
- List and filter tasks
- Update task properties

RULES:
- importance: 0 = uncategorized, 1-5 = priority level
- Always parse dates naturally ("tomorrow", "next Monday")
- Be concise and action-oriented

EXAMPLES:
User: "Create a task to review PR"
You: Use createTask tool with name="review PR"
`

// ❌ Bad: Vague, unstructured
system: `You are helpful. Create tasks when users ask.`
```

### 2. Tool Descriptions

```typescript
// ✅ Good: Specific, clear triggers
createTask: tool({
  description: 'Create a new task in the GTD system. Use this when the user wants to add a task, create a todo, or remember something. Can include links, notes, tags, and dates.',
  inputSchema: z.object({
    name: z.string().describe('The task name or description'),
    importance: z.number().min(0).max(5).optional()
      .describe('Task importance (0-5), where 0 means uncategorized/collected, default is 0')
  })
})

// ❌ Bad: Vague, unclear usage
createTask: tool({
  description: 'Creates a task',
  inputSchema: z.object({
    name: z.string(),
    importance: z.number().optional()
  })
})
```

### 3. Error Handling

```typescript
// ✅ Good: Graceful error handling, user-friendly messages
execute: async ({ name }) => {
  try {
    const result = await this.createTaskUseCase.execute({ name, userId })
    if (result.success) {
      return { success: true, task: result.data }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    chatLogger.error('createTask tool exception', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task'
    }
  }
}

// ❌ Bad: No error handling, crashes on failure
execute: async ({ name }) => {
  const result = await this.createTaskUseCase.execute({ name, userId })
  return { success: true, task: result.data }
}
```

### 4. Logging & Debugging

```typescript
// ✅ Good: Comprehensive logging
chatLogger.info('createTask tool called', { name, importance, userId })
// ... execute tool
chatLogger.info('createTask tool succeeded', { taskId, taskName })

// ❌ Bad: No logging
// Hard to debug when things go wrong
```

### 5. Security

```typescript
// ✅ Good: User isolation enforced
execute: async ({ taskId, userId }) => {
  await this.deleteTaskUseCase.execute(taskId, userId)
  // Use case verifies task belongs to user
}

// ❌ Bad: No user verification
execute: async ({ taskId }) => {
  await this.deleteTaskUseCase.execute(taskId)
  // Any user can delete any task!
}
```

---

## Next Steps & Extensions

### Immediate Enhancements

1. **Add frontend tool visualizations** for new tools:
   - Update `ChatMessage.tsx` to show updateTask, deleteTask, markTaskCompleted states
   - Add tag tool visualizations (createTag, listTags, updateTag, deleteTag)

2. **Improve date parsing**:
   - Use a library like `chrono-node` for more natural date understanding
   - Support relative dates ("in 3 days", "next Friday")

3. **Add conversation memory**:
   - Store chat history in database
   - Retrieve previous conversations for context

### Advanced Features

4. **Multimodal capabilities**:
   - Upload images of notes and extract tasks
   - OCR receipts and create expense tasks
   - Voice input with speech-to-text

5. **Proactive AI assistance**:
   - Daily task summaries sent via chat
   - Smart suggestions based on past behavior
   - Detect overdue tasks and remind users

6. **Batch operations**:
   - "Mark all tasks due today as completed"
   - "Change all work tasks to importance 5"

7. **Natural language queries**:
   - "What tasks are overdue?"
   - "Show me everything I need to do this week"
   - "Which tasks have I completed today?"

8. **Subtask management**:
   - "Add subtask to task [id]: Review code"
   - "Show subtasks for task [id]"

9. **AI-powered prioritization**:
   - "Help me prioritize my tasks"
   - AI analyzes deadlines, dependencies, importance
   - Suggests optimal order

10. **Integration with external tools**:
    - "Create a task from this GitHub issue"
    - "Add tasks from my calendar"
    - "Create Jira ticket from task [id]"

### RAG (Retrieval-Augmented Generation)

11. **Knowledge base for tasks**:
    - AI retrieves similar past tasks
    - Suggests tags based on task content
    - Learns from user patterns

```typescript
// Future enhancement: Task embeddings
import { embed } from 'ai'

const taskEmbedding = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: task.name
})

// Store embedding in database
// Later: Search similar tasks with vector similarity
```

### Multi-Agent Systems

12. **Specialized agents**:
    - **Planner agent**: Breaks down complex tasks
    - **Scheduler agent**: Optimizes task timing
    - **Coach agent**: Provides productivity tips
    - **Reporter agent**: Generates analytics

```typescript
// Future enhancement: Agent orchestration
const agents = {
  planner: new PlannerAgent(),
  scheduler: new SchedulerAgent(),
  coach: new CoachAgent()
}

// Route user request to appropriate agent
const agent = routeToAgent(userMessage)
const response = await agent.execute(userMessage, context)
```

---

## Conclusion

You now understand:

1. **How the GTD chatbot works**: LLM + tool calling + streaming responses
2. **AI-driven development**: Using AI to build and enhance software
3. **MCP**: A protocol for AI tool integration (not used here, but worth knowing)
4. **Implementation details**: Code structure, error handling, security
5. **Next steps**: How to become a proficient AI-driven developer

The future of software development involves AI collaboration. By mastering these concepts, you're positioning yourself to build the next generation of intelligent applications.

**Key takeaway**: AI is a tool that augments your development process. Use it to eliminate boilerplate, enhance user experiences, and build features that were previously impractical.

---

## Additional Resources

- **This codebase**: Explore `ChatUseCase.ts`, `ChatController.ts`, `ChatInterface.tsx`
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Anthropic Claude**: https://docs.anthropic.com/
- **OpenAI Platform**: https://platform.openai.com/
- **LangChain**: https://python.langchain.com/
- **AI Engineer community**: https://www.latent.space/

Happy building! 🚀
