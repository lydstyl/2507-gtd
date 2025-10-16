# Chatbot Quick Start Guide

## Setup in 3 Steps

### 1. Configure Your LLM Provider

Edit `backend/.env` and add your LLM configuration:

```bash
# Choose your provider
LLM_PROVIDER="anthropic"  # Options: anthropic, openai, openrouter

# Add your API key (choose one based on your provider)
ANTHROPIC_API_KEY="sk-ant-..."
# OR
# OPENAI_API_KEY="sk-..."
# OR
# OPENROUTER_API_KEY="sk-or-..."
```

### 2. Start the Application

```bash
# From the root directory
npm run dev
```

This starts:
- Backend on `http://localhost:3000`
- Frontend on `http://localhost:5173`

### 3. Open the Chat

1. Log in to your GTD app
2. Click the "💬 Chat" link in the navigation header
3. Start chatting with your task assistant!

## Example Conversations

### Creating Tasks

```
You: "Create a task to buy groceries tomorrow"
Assistant: ✓ Task created: Buy groceries tomorrow

You: "Add a high priority task to review the code"
Assistant: ✓ Task created: Review the code (importance: 5)

You: "Remind me to call mom next week"
Assistant: ✓ Task created: Call mom (planned for next week)
```

### Listing Tasks

```
You: "Show me all my tasks"
Assistant: Found 15 tasks:
• Buy groceries (2025-01-17)
• Review the code
• Call mom (2025-01-24)
• ...

You: "What are my high priority tasks?"
Assistant: Found 3 high priority tasks:
• Review the code (importance: 5)
• ...
```

## Get API Keys

- **Anthropic Claude**: [console.anthropic.com](https://console.anthropic.com/)
- **OpenAI**: [platform.openai.com](https://platform.openai.com/)
- **OpenRouter**: [openrouter.ai](https://openrouter.ai/)

## Troubleshooting

### Chat not working?

1. Check that your `.env` file has the correct `LLM_PROVIDER` and API key
2. Restart the backend: `cd backend && npm run dev`
3. Check the browser console and backend logs for errors

### API errors?

- **401 Unauthorized**: Your API key is invalid
- **429 Rate Limited**: You've exceeded your provider's rate limits
- **500 Server Error**: Check backend logs for details

## Learn More

See [CHATBOT.md](./CHATBOT.md) for detailed documentation including:
- Architecture details
- Adding new tools/capabilities
- Adding new LLM providers
- Security considerations
- Advanced configuration
