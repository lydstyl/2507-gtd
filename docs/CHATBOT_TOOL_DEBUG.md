# Chatbot Tool Execution Debug Guide

## Problem

The chatbot starts executing the `listTasks` tool but never returns results:

```
User: "List my tasks for today"
Bot: "I'll help you list tasks that are planned for today."
     Fetching tasks...
     [Nothing happens - tasks never appear]
```

**Stream shows**:
```
data: {"type":"tool-input-start","toolCallId":"...","toolName":"listTasks"}
data: {"type":"finish-step"}
data: {"type":"finish"}
[No tool-result event!]
```

---

## What I Added

I've added comprehensive debug logging to both tools (`createTask` and `listTasks`) to help diagnose the issue.

### Debug Logging Added

**File**: [backend/src/usecases/chat/ChatUseCase.ts](backend/src/usecases/chat/ChatUseCase.ts)

Both tools now log:
1. When they are called and with what parameters
2. Progress during execution
3. Final result or error
4. Full JSON output

---

## How to Debug

### Step 1: Restart Backend with Logs

```bash
cd backend
npm run dev
```

Watch the backend terminal carefully.

### Step 2: Try the Chatbot Again

In the chat interface, send:
```
List my tasks for today
```

### Step 3: Check Backend Logs

You should see logs like this:

**✅ GOOD - Tool is working:**
```
[ChatUseCase] listTasks tool called with: { importance: undefined, complexity: undefined, search: undefined, limit: 20, userId: 'cm...' }
[ChatUseCase] Fetching tasks with filters: {}
[ChatUseCase] Tasks fetched: 5
[ChatUseCase] Returning result: {
  "success": true,
  "count": 5,
  "total": 5,
  "tasks": [ ... ]
}
```

**❌ BAD - Tool is failing:**
```
[ChatUseCase] listTasks tool called with: { ... }
[ChatUseCase] Fetching tasks with filters: {}
[ChatUseCase] Error in listTasks tool: Error: ...
```

**❌ WORSE - Tool never called:**
```
[No logs appear at all]
```

---

## Possible Issues and Fixes

### Issue 1: Tool Never Called (No logs at all)

**Symptoms**: No `[ChatUseCase]` logs appear when you send a message

**Possible Causes**:
- Backend not restarted after rebuild
- Old build still running
- Vercel AI SDK not executing tools

**Fix**:
```bash
# Kill all node processes
pkill -f node

# Rebuild
cd backend
npm run build

# Restart
npm run dev
```

---

### Issue 2: Tool Called But Hangs

**Symptoms**: You see "listTasks tool called with:" but no "Fetching tasks" or "Tasks fetched" logs

**Possible Cause**: Database query hanging

**Fix**: Check database connection
```bash
# Test database
cd backend
npx prisma studio
```

---

### Issue 3: Tool Called But Errors

**Symptoms**: You see error logs like "Error in listTasks tool:"

**Fix**: Check the error message in the logs. Common errors:

**Error: "Cannot read property 'length' of undefined"**
- `getAllTasksUseCase.executeRootTasks` returned undefined
- Check TaskRepository implementation

**Error: "userId is required"**
- Authentication issue
- Check that user.userId is being passed correctly

**Error: Database connection error**
- Database not accessible
- Check `.env` DATABASE_URL setting

---

### Issue 4: Tool Returns But Frontend Doesn't Show Results

**Symptoms**: Backend logs show successful result, but frontend shows "Fetching tasks..." forever

**Possible Cause**: Frontend not handling tool results properly

**Check Frontend**: Open browser DevTools (F12) → Console tab

Look for errors related to:
- Chat message parsing
- Tool result rendering
- React component errors

---

## Expected Flow

### Complete Successful Flow:

1. **User sends**: "List my tasks for today"

2. **Backend receives**: POST /api/chat with user message

3. **LLM decides**: "I need to use the listTasks tool"

4. **Stream starts**:
   ```
   type: "text-delta" → "I'll help you list tasks..."
   type: "tool-input-start" → toolName: "listTasks"
   ```

5. **Tool executes** (backend logs):
   ```
   [ChatUseCase] listTasks tool called
   [ChatUseCase] Fetching tasks
   [ChatUseCase] Tasks fetched: 5
   [ChatUseCase] Returning result
   ```

6. **Stream continues**:
   ```
   type: "tool-result" → result: { success: true, tasks: [...] }
   type: "text-delta" → "Here are your tasks..."
   type: "finish"
   ```

7. **Frontend renders**: Task list appears in chat

---

## Debugging Checklist

Run through this checklist to diagnose the issue:

### Backend

- [ ] Backend rebuilt: `npm run build` (no errors)
- [ ] Backend restarted: `npm run dev`
- [ ] Backend logs show server started on port 3000
- [ ] Database accessible: `npx prisma studio` opens
- [ ] Environment variables loaded: `grep DATABASE_URL backend/.env` shows path
- [ ] OPENROUTER_API_KEY set: `grep OPENROUTER_API_KEY backend/.env` shows key

### API Request

- [ ] POST /api/chat returns 200 (not 401, not 500)
- [ ] Request has Authorization header with Bearer token
- [ ] Request body has messages array

### Tool Execution

- [ ] Backend logs show `[ChatUseCase] listTasks tool called with:`
- [ ] Backend logs show `[ChatUseCase] Fetching tasks with filters:`
- [ ] Backend logs show `[ChatUseCase] Tasks fetched: N`
- [ ] Backend logs show `[ChatUseCase] Returning result:`
- [ ] Result JSON looks correct (has success: true, tasks array)

### Stream Response

- [ ] Network tab shows streaming response (Transfer-Encoding: chunked)
- [ ] Stream includes `tool-input-start` event
- [ ] Stream includes `tool-result` event (THIS IS THE KEY ONE!)
- [ ] Stream includes `finish` event

### Frontend

- [ ] Browser console has no errors
- [ ] Chat interface shows user message
- [ ] Chat interface shows bot response starting
- [ ] Frontend logs show tool result received (if you added logging)

---

## Quick Diagnostic Script

Run this in the backend directory to check configuration:

```bash
#!/bin/bash
echo "=== Backend Configuration Check ==="
echo ""

echo "1. Node version:"
node --version

echo ""
echo "2. Dependencies installed:"
ls node_modules/ai node_modules/@ai-sdk/openai 2>/dev/null && echo "✅ AI SDK installed" || echo "❌ AI SDK missing"

echo ""
echo "3. Environment variables:"
grep -q "OPENROUTER_API_KEY" .env && echo "✅ OPENROUTER_API_KEY set" || echo "❌ OPENROUTER_API_KEY missing"
grep -q "DATABASE_URL" .env && echo "✅ DATABASE_URL set" || echo "❌ DATABASE_URL missing"

echo ""
echo "4. Build status:"
ls dist/usecases/chat/ChatUseCase.js 2>/dev/null && echo "✅ ChatUseCase built" || echo "❌ ChatUseCase not built"

echo ""
echo "5. Database connection:"
timeout 2 npx prisma db execute --url "file:./prisma/dev.db" --sql "SELECT 1" 2>/dev/null && echo "✅ Database accessible" || echo "❌ Database not accessible"

echo ""
echo "6. Port availability:"
lsof -ti:3000 >/dev/null && echo "✅ Port 3000 in use (backend running)" || echo "❌ Port 3000 free (backend not running)"
```

Save as `check-backend.sh`, make executable (`chmod +x check-backend.sh`), and run:
```bash
./check-backend.sh
```

---

## Manual Test

### Test the UseCase Directly

Create a test file to verify the use case works outside of the chat context:

**File**: `backend/test-listTasks.ts`
```typescript
import { Container } from './src/infrastructure/container'
import { config } from 'dotenv'

config()

async function testListTasks() {
  const container = Container.getInstance()
  const getAllTasksUseCase = container.getAllTasksUseCase()

  const userId = 'YOUR_USER_ID_HERE' // Replace with your actual userId

  console.log('Testing listTasks...')
  const tasks = await getAllTasksUseCase.executeRootTasks(userId)

  console.log('Tasks found:', tasks.length)
  console.log('Tasks:', JSON.stringify(tasks.slice(0, 3), null, 2))
}

testListTasks().catch(console.error)
```

Run it:
```bash
npx tsx backend/test-listTasks.ts
```

If this works but the chat doesn't, the issue is in the LLM integration, not the use case.

---

## Known Issues

### Issue: Vercel AI SDK Tool Execution Not Completing

**Version Check**: What version of `ai` are you using?
```bash
grep '"ai"' backend/package.json
```

**Known Issue**: Some versions of the Vercel AI SDK have issues with tool execution in streaming mode.

**Workaround**: Try using `generateText` instead of `streamText` for debugging:

```typescript
// Temporarily replace streamText with generateText
import { generateText } from 'ai'

const result = await generateText({
  model: this.model,
  messages,
  tools: { ... }
})

console.log('Tool calls:', result.toolCalls)
console.log('Tool results:', result.toolResults)
```

This will help determine if the tools are executing correctly.

---

## Next Steps

1. **Restart backend** with the new debug logging
2. **Try the chat** again
3. **Copy the backend logs** and share them
4. **Copy the browser console logs** and share them
5. **Copy the network response** (POST /api/chat) and share it

With those three pieces of information, we can diagnose exactly what's going wrong.

---

**Date**: October 16, 2025
**Status**: 🔍 DEBUGGING
**Issue**: Tool execution starts but never completes
**Added**: Comprehensive debug logging to ChatUseCase
