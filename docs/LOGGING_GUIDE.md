# Logging System Guide

## Overview

The application now has a comprehensive file-based logging system using Winston. All chat-related activity is logged to files for debugging.

---

## Log Files

All logs are stored in `/home/gab/apps/2507-gtd/backend/logs/`

### Log Files Created

1. **`combined.log`** - All log levels (debug, info, warn, error)
2. **`error.log`** - Only error-level logs
3. **`chat.log`** - All chat-specific logs (requests, tool calls, etc.)

### Log Rotation

- **Max file size**: 10MB
- **Max files kept**: 5 (oldest rotated out)
- **Tailable**: Yes (you can `tail -f` to watch live)

---

## What Gets Logged

### Chat Controller (`ChatController.ts`)

Each request gets a unique `requestId` for tracking:

- **Request received**: Method, path, auth status
- **Request details**: Message count, userId
- **Authentication failures**: Missing user, invalid token
- **Message conversion**: UI to model format
- **UseCase execution**: When ChatUseCase starts
- **Stream response**: Headers, chunks streamed
- **Errors**: Any exceptions with stack traces

### Chat Use Case (`ChatUseCase.ts`)

- **UseCase called**: userId, message count, last message preview
- **Tool execution started**: Which tool, parameters
- **Tool execution progress**: Filters used, tasks fetched
- **Tool results**: Success/failure, data returned
- **Tool completion**: Final status
- **Errors**: Exceptions in tool execution

---

## Log Format

```
YYYY-MM-DD HH:mm:ss.SSS [LEVEL]: [CHAT] Message {metadata}
```

### Example Logs

**Request received**:
```
2025-10-16 21:45:32.123 [INFO]: [CHAT] [abc123] Chat request received {
  "method": "POST",
  "path": "/api/chat",
  "hasAuth": true
}
```

**Tool called**:
```
2025-10-16 21:45:32.456 [INFO]: [CHAT] listTasks tool called {
  "importance": undefined,
  "complexity": undefined,
  "search": undefined,
  "limit": 20,
  "userId": "cm..."
}
```

**Tool result**:
```
2025-10-16 21:45:32.789 [INFO]: [CHAT] listTasks fetched tasks {
  "totalTasks": 5,
  "willReturnCount": 5
}
```

**Error**:
```
2025-10-16 21:45:33.012 [ERROR]: [CHAT] listTasks tool exception {
  "error": "Error: Database connection failed",
  "stack": "Error: Database connection failed\n    at ..."
}
```

---

## How to View Logs

### Watch Logs Live

```bash
# Watch all chat logs
tail -f backend/logs/chat.log

# Watch combined logs
tail -f backend/logs/combined.log

# Watch errors only
tail -f backend/logs/error.log

# Follow last 50 lines
tail -n 50 -f backend/logs/chat.log
```

### Search Logs

```bash
# Find specific request by ID
grep "abc123" backend/logs/chat.log

# Find all listTasks calls
grep "listTasks tool called" backend/logs/chat.log

# Find all errors
grep ERROR backend/logs/chat.log

# Find logs for specific user
grep "cm..." backend/logs/chat.log
```

### View Recent Logs

```bash
# Last 100 lines
tail -n 100 backend/logs/chat.log

# Last 20 errors
tail -n 20 backend/logs/error.log

# View entire file
cat backend/logs/chat.log
```

---

## Debugging with Logs

### Scenario: Tool Never Gets Called

**Check**:
1. Look for request received log
2. Check if userId is present
3. Verify ChatUseCase.execute is called

```bash
tail -f backend/logs/chat.log
```

**Expected sequence**:
```
[INFO]: [CHAT] [abc123] Chat request received
[DEBUG]: [CHAT] [abc123] Request details
[INFO]: [CHAT] [abc123] Converting messages
[INFO]: [CHAT] [abc123] Executing ChatUseCase
[INFO]: [CHAT] ChatUseCase.execute called
```

**If missing ChatUseCase.execute**:
- LLM not deciding to call tool
- Check system prompt
- Check tool descriptions

---

### Scenario: Tool Starts But Never Completes

**Check**:
```bash
grep "listTasks" backend/logs/chat.log | tail -20
```

**Expected sequence**:
```
[INFO]: [CHAT] listTasks tool called { ... }
[DEBUG]: [CHAT] listTasks fetching with filters { ... }
[INFO]: [CHAT] listTasks fetched tasks { totalTasks: 5 }
[DEBUG]: [CHAT] listTasks tool result { success: true, ... }
[INFO]: [CHAT] listTasks tool completed successfully
```

**If stops after "tool called"**:
- Database query hanging
- Check `getAllTasksUseCase.executeRootTasks`

**If stops after "fetched tasks"**:
- Error mapping tasks
- Check error logs

**If stops after "tool result"**:
- LLM stream issue
- Check stream pump logs

---

### Scenario: Tool Returns But Frontend Doesn't Show

**Check backend logs**:
```bash
grep "Stream completed" backend/logs/chat.log
```

Should see:
```
[INFO]: [CHAT] [abc123] Stream completed { chunkCount: 45 }
```

**If stream completed**:
- Frontend issue, not backend
- Check browser console
- Check React component rendering

---

## Log Levels

Set via `LOG_LEVEL` environment variable in `.env`:

```bash
# In backend/.env
LOG_LEVEL="debug"   # Show everything (default)
# LOG_LEVEL="info"  # Normal operation
# LOG_LEVEL="warn"  # Warnings and errors
# LOG_LEVEL="error" # Errors only
```

### Level Hierarchy

```
error < warn < info < debug
```

- `error`: Set to error, only errors logged
- `warn`: Set to warn, warnings and errors logged
- `info`: Set to info, info/warn/error logged
- `debug`: Set to debug, everything logged (recommended for troubleshooting)

---

## Analyzing the Tool Execution Problem

Based on your stream output:

```
data: {"type":"tool-input-start","toolCallId":"...","toolName":"listTasks"}
data: {"type":"finish-step"}
data: {"type":"finish"}
[No tool-result event!]
```

### What the Logs Will Show

**1. Check if tool is called**:
```bash
grep "listTasks tool called" backend/logs/chat.log
```

If **YES**: Tool execution started
If **NO**: LLM decided to call tool but our code never received it

**2. Check if tool fetches data**:
```bash
grep "listTasks fetched tasks" backend/logs/chat.log
```

If **YES**: Database query succeeded
If **NO**: Hanging or error in `executeRootTasks`

**3. Check if tool completes**:
```bash
grep "listTasks tool completed" backend/logs/chat.log
```

If **YES**: Tool returned result successfully
If **NO**: Error mapping tasks or returning result

**4. Check for errors**:
```bash
grep "listTasks tool exception" backend/logs/chat.log
```

If **YES**: Exception occurred (will show error details)

---

## Log File Management

### Clean Old Logs

```bash
# Remove all log files
rm backend/logs/*.log

# Remove specific log
rm backend/logs/chat.log

# Restart backend to create new logs
cd backend && npm run dev
```

### Archive Logs

```bash
# Create archive
tar -czf logs-backup-$(date +%Y%m%d).tar.gz backend/logs/

# Move to archive directory
mkdir -p ~/log-archives
mv logs-backup-*.tar.gz ~/log-archives/
```

### Log Rotation

Winston automatically rotates logs when they reach 10MB. Old logs are named:
```
chat.log      # Current
chat.log.1    # Previous
chat.log.2    # Older
...
chat.log.4    # Oldest (deleted when new rotation needed)
```

---

## Troubleshooting

### Logs Not Being Created

**Check directory exists**:
```bash
ls -la backend/logs/
```

**Create if missing**:
```bash
mkdir -p backend/logs
```

**Check permissions**:
```bash
chmod 755 backend/logs
```

### Logs Not Updating

**Restart backend**:
```bash
cd backend
npm run dev
```

**Check LOG_LEVEL**:
```bash
grep LOG_LEVEL backend/.env
```

### Too Many Logs

**Reduce log level**:
```bash
# In backend/.env
LOG_LEVEL="info"  # or "warn"
```

**Restart backend** to apply changes.

---

## Next Steps for Debugging

1. **Restart backend** with new logging:
   ```bash
   cd backend
   npm run dev
   ```

2. **Open log file** in separate terminal:
   ```bash
   tail -f backend/logs/chat.log
   ```

3. **Try chatbot** at http://localhost:5173/chat

4. **Send message**: "List my tasks"

5. **Watch logs** in terminal - you'll see exactly:
   - Request received
   - Tool called
   - Tasks fetched
   - Result returned
   - Or where it fails!

6. **Share logs** with me to debug further

---

## Quick Debug Command

Run this to see the complete flow of your last chat request:

```bash
# Get the last request ID
REQUEST_ID=$(grep "Chat request received" backend/logs/chat.log | tail -1 | grep -oP '\[\K[a-z0-9]+(?=\])')

# Show all logs for that request
grep "[$REQUEST_ID]" backend/logs/chat.log

# Also show tool logs (don't have requestId)
grep -A 5 "listTasks tool" backend/logs/chat.log | tail -30
```

---

**Created**: October 16, 2025
**Purpose**: Debug chatbot tool execution issues
**Log Location**: `/home/gab/apps/2507-gtd/backend/logs/`
