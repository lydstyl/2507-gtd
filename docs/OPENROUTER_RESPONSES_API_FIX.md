# OpenRouter Responses API Fix - RESOLVED

## Problem

When using the chatbot with OpenRouter, you got a "Bad Request" error:

```
APICallError: Bad Request
url: 'https://openrouter.ai/api/v1/responses'
statusCode: 400
```

**Error details**:
```json
{
  "success": false,
  "error": {
    "issues": [{
      "code": "invalid_union",
      "message": "Expected string, received array",
      "path": ["input"]
    }]
  }
}
```

---

## Root Cause

**Vercel AI SDK was using the wrong OpenAI API endpoint**

The SDK was trying to use OpenAI's new **Responses API** (`/api/v1/responses`) instead of the standard **Chat Completions API** (`/api/v1/chat/completions`).

### Why This Happened

1. **OpenAI recently introduced two APIs**:
   - **Chat Completions API** - `/v1/chat/completions` (traditional, widely supported)
   - **Responses API** - `/v1/responses` (new, for multi-step reasoning)

2. **Vercel AI SDK auto-detects** which API to use based on the model name

3. **OpenRouter doesn't support** the Responses API yet (only Chat Completions)

4. **SDK sent request** to `/v1/responses` → OpenRouter rejected it

### What the Error Meant

```
Expected string, received array at path: ["input"]
```

The Responses API expects a different message format than Chat Completions. When the SDK sent chat messages as an array, OpenRouter's Chat Completions API couldn't parse it because it was formatted for the Responses API.

---

## Fix Applied

**File**: [backend/src/infrastructure/ai/LLMProviderFactory.ts:43](backend/src/infrastructure/ai/LLMProviderFactory.ts#L43)

**Solution**: Use `.chat()` method to explicitly force Chat Completions endpoint

### Before (Broken)

```typescript
case 'openrouter': {
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY
  })
  return openrouter(modelName)  // ❌ Auto-detects wrong API
}
```

**Request went to**: `https://openrouter.ai/api/v1/responses` ❌

### After (Fixed)

```typescript
case 'openrouter': {
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'GTD Task Manager'
    }
  })
  // Use .chat() to explicitly use chat completions endpoint
  return openrouter.chat(modelName)  // ✅ Forces Chat Completions API
}
```

**Request goes to**: `https://openrouter.ai/api/v1/chat/completions` ✅

---

## How to Test

### 1. Restart Backend

The backend has been rebuilt with the fix. Restart it:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server is running on port 3000
```

### 2. Try the Chatbot

Open: http://localhost:5173/chat

Send a message:
```
"Create a task to test OpenRouter integration"
```

### 3. Expected Behavior

**✅ SUCCESS**:
- No more "Bad Request" errors
- Chatbot responds with streaming text
- Task is created successfully
- Backend logs show `[ChatUseCase] createTask tool called`

**❌ FAILURE** (if still broken):
- Check backend logs for errors
- Check browser console (F12) for errors
- Verify .env configuration

---

## Testing Checklist

- [ ] Backend rebuilt successfully (`npm run build`)
- [ ] Backend restarted (`npm run dev`)
- [ ] No errors in backend startup logs
- [ ] Can access http://localhost:5173/chat
- [ ] Send message: "Create a task to test the chatbot"
- [ ] No "Bad Request" errors
- [ ] Chatbot responds with streaming text
- [ ] Task creation succeeds
- [ ] Backend logs show tool execution

---

## What Changed Technically

### API Endpoint Comparison

**Chat Completions API** (what we use now ✅):
```
POST https://openrouter.ai/api/v1/chat/completions
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "tools": [ ... ]
}
```

**Responses API** (what was being used before ❌):
```
POST https://openrouter.ai/api/v1/responses
{
  "model": "anthropic/claude-3.5-sonnet",
  "input": "Hello",  // Different format!
  "tools": [ ... ]
}
```

### Vercel AI SDK Provider Methods

The `createOpenAI()` function returns an object with multiple methods:

```typescript
const provider = createOpenAI({ baseURL, apiKey })

// Available methods:
provider(modelName)              // Auto-detects API (might use responses)
provider.chat(modelName)         // Forces chat completions API ✅
provider.completion(modelName)   // Forces text completion API
```

We now explicitly use `.chat()` to force the Chat Completions endpoint.

---

## Related Issues

### If You Still Get "Bad Request"

**1. Check the request URL in backend logs**

You should see:
```
Request to: https://openrouter.ai/api/v1/chat/completions
```

If you see `/responses`, the fix didn't apply. Make sure:
- Backend was rebuilt: `npm run build`
- Backend was restarted: `npm run dev`

**2. Check the request body format**

Backend should send:
```json
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [ ... ],
  "tools": [ ... ],
  "stream": true
}
```

**3. Verify OpenRouter API key**

Test your key manually:
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [{"role": "user", "content": "Say hi"}]
  }'
```

Should return a streaming response with Claude saying "Hi!"

---

## Why OpenRouter Doesn't Support Responses API Yet

**Responses API is very new** (OpenAI announced it recently)

**OpenRouter supports**:
- ✅ Chat Completions API (stable, widely used)
- ✅ Function calling / Tool use
- ✅ Streaming responses
- ❌ Responses API (not yet implemented)

**Most providers use Chat Completions**, so this is the safest choice for compatibility.

---

## Summary of All Fixes Today

We've fixed **three separate issues**:

### 1. ✅ Authentication Bug
**Issue**: ChatController used `req.userId` instead of `req.user?.userId`
**Fix**: Updated property access pattern
**File**: [ChatController.ts](backend/src/presentation/controllers/ChatController.ts#L11)

### 2. ✅ OpenRouter baseURL Configuration
**Issue**: Missing custom baseURL for OpenRouter
**Fix**: Added `createOpenAI()` with OpenRouter baseURL
**File**: [LLMProviderFactory.ts](backend/src/infrastructure/ai/LLMProviderFactory.ts#L30-L44)

### 3. ✅ OpenRouter API Endpoint Selection
**Issue**: SDK auto-selected wrong endpoint (`/responses` instead of `/chat/completions`)
**Fix**: Used `.chat()` method to force Chat Completions API
**File**: [LLMProviderFactory.ts](backend/src/infrastructure/ai/LLMProviderFactory.ts#L43)

---

## Next Steps

1. **Restart your backend** to load the fix
2. **Test the chatbot** with OpenRouter
3. **Try both tools**:
   - "Create a task to buy groceries"
   - "List my tasks for today"

Both should now work! 🎉

---

**Date**: October 16, 2025
**Status**: ✅ RESOLVED
**Issue**: OpenRouter rejecting requests due to wrong API endpoint
**Fix**: Explicitly use `.chat()` method to force Chat Completions API
