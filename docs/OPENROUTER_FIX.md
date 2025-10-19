# OpenRouter Configuration Fix - RESOLVED

## Problem

When using OpenRouter with the chatbot, you received an API authentication error:

```
APICallError: Incorrect API key provided: sk-or-v1*****...
You can find your API key at https://platform.openai.com/account/api-keys.
```

The error showed the request was going to `https://api.openai.com/v1/responses` instead of OpenRouter's API.

---

## Root Cause

**Missing OpenRouter baseURL configuration in LLMProviderFactory.ts**

The code was using the `openai()` function directly without configuring the custom baseURL for OpenRouter. This meant:
- API requests went to OpenAI's servers instead of OpenRouter
- OpenRouter API key was rejected by OpenAI
- The model name `anthropic/claude-3.5-sonnet` was invalid for OpenAI

### What Was Wrong

```typescript
// ❌ WRONG - No baseURL, uses OpenAI's default endpoint
case 'openrouter': {
  const modelName = model || 'anthropic/claude-3.5-sonnet'
  return openai(modelName)  // Goes to api.openai.com
}
```

---

## Fix Applied

**File**: [backend/src/infrastructure/ai/LLMProviderFactory.ts](backend/src/infrastructure/ai/LLMProviderFactory.ts#L30-L42)

**Solution**: Use `createOpenAI()` to configure a custom OpenRouter provider

```typescript
// ✅ CORRECT - Custom provider with OpenRouter baseURL
case 'openrouter': {
  const modelName = model || 'anthropic/claude-3.5-sonnet'
  // Create custom OpenAI-compatible provider for OpenRouter
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      'HTTP-Referer': 'http://localhost:3000',  // For OpenRouter analytics
      'X-Title': 'GTD Task Manager'              // For OpenRouter analytics
    }
  })
  return openrouter(modelName)
}
```

### What Changed

1. **Import `createOpenAI`**: Added to imports from `@ai-sdk/openai`
2. **Custom Provider**: Created OpenRouter provider with correct baseURL
3. **API Key**: Passed OPENROUTER_API_KEY directly (no env var copying)
4. **Headers**: Added optional headers for OpenRouter analytics

---

## How OpenRouter Works

OpenRouter is an **OpenAI-compatible gateway** that routes requests to multiple AI providers:
- Uses OpenAI's API format
- Routes to providers: Anthropic, OpenAI, Google, Meta, etc.
- Requires custom baseURL: `https://openrouter.ai/api/v1`
- Supports model names like: `anthropic/claude-3.5-sonnet`, `openai/gpt-4o`, etc.

---

## How to Test

1. **Restart your backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify your .env configuration**:
   ```bash
   LLM_PROVIDER="openrouter"
   LLM_MODEL="anthropic/claude-3.5-sonnet"
   OPENROUTER_API_KEY="sk-or-v1-..."
   ```

3. **Open the chatbot**:
   ```
   http://localhost:5173/chat
   ```

4. **Send a test message**:
   ```
   "Create a task to test OpenRouter integration"
   ```

5. **Expected behavior**:
   - No more API key errors
   - Chatbot responds using Claude 3.5 Sonnet via OpenRouter
   - Task created successfully

---

## Testing Checklist

- [ ] Backend restarted successfully
- [ ] OPENROUTER_API_KEY is set in `.env`
- [ ] LLM_PROVIDER="openrouter" in `.env`
- [ ] Can access http://localhost:5173/chat
- [ ] No API key errors in backend logs
- [ ] Chatbot responds with streaming output
- [ ] Can create tasks via chat
- [ ] Can list tasks via chat

---

## Troubleshooting

### Still Getting API Key Error?

**Check your OPENROUTER_API_KEY**:
```bash
grep OPENROUTER_API_KEY backend/.env
```

Should show:
```
OPENROUTER_API_KEY="sk-or-v1-..."
```

**Test your OpenRouter API key**:
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

Should return a list of available models.

### Wrong Model Error?

**Check available models**: https://openrouter.ai/docs/models

Popular choices:
- `anthropic/claude-3.5-sonnet` (recommended)
- `anthropic/claude-3-opus`
- `openai/gpt-4o`
- `google/gemini-pro-1.5`

**Update your .env**:
```bash
LLM_MODEL="anthropic/claude-3.5-sonnet"
```

### Rate Limit Error?

OpenRouter has different rate limits per model. Check:
- Your OpenRouter dashboard: https://openrouter.ai/keys
- Model limits: https://openrouter.ai/docs/limits

Consider:
- Adding credits to your OpenRouter account
- Using a different model with higher limits
- Implementing retry logic (already handled by Vercel AI SDK)

### Request Going to Wrong URL?

**Check backend logs** when sending a chat message. Should see:
```
Request URL: https://openrouter.ai/api/v1/...
```

If you see `https://api.openai.com`, the fix didn't apply. Make sure:
1. Backend was rebuilt: `cd backend && npm run build`
2. Backend was restarted: `npm run dev`
3. Using the correct LLM_PROVIDER: `LLM_PROVIDER="openrouter"`

---

## Available OpenRouter Models

### Anthropic (Claude)
- `anthropic/claude-3.5-sonnet` - Best for most tasks (recommended)
- `anthropic/claude-3-opus` - Most capable, slower, more expensive
- `anthropic/claude-3-haiku` - Fastest, cheapest

### OpenAI
- `openai/gpt-4o` - Latest GPT-4 with vision
- `openai/gpt-4-turbo` - Fast GPT-4
- `openai/gpt-3.5-turbo` - Fastest, cheapest

### Google
- `google/gemini-pro-1.5` - Latest Gemini
- `google/gemini-flash-1.5` - Faster Gemini

### Meta
- `meta-llama/llama-3.1-405b` - Largest Llama model
- `meta-llama/llama-3.1-70b` - Good balance

See all models: https://openrouter.ai/docs/models

---

## Code Changes Summary

### Files Modified

1. **backend/src/infrastructure/ai/LLMProviderFactory.ts**
   - Added `createOpenAI` import
   - Updated OpenRouter case to use custom provider
   - Configured baseURL and headers
   - Passed API key directly

### Before vs After

**Before** (Broken):
```typescript
case 'openrouter':
  return openai(modelName)  // Wrong URL, wrong API key
```

**After** (Fixed):
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
  return openrouter(modelName)
}
```

---

## Related Documentation

- [API Keys Guide](docs/API_KEYS_GUIDE.md) - How to get OpenRouter API key
- [Chatbot Quick Start](docs/CHATBOT_QUICK_START.md) - Basic chatbot setup
- [Chatbot Documentation](docs/CHATBOT.md) - Comprehensive chatbot guide
- [Chat Auth Fix](CHAT_AUTH_FIX.md) - Previous authentication fix

---

## OpenRouter Benefits

✅ **Single API key** for multiple AI providers
✅ **Unified pricing** - one bill for all models
✅ **Automatic fallback** - if one provider is down, tries another
✅ **Model comparison** - test different models without switching keys
✅ **Cost tracking** - see spending per model
✅ **Rate limit management** - shared limits across providers

---

**Date**: October 16, 2025
**Status**: ✅ RESOLVED
**Issue**: OpenRouter API requests going to OpenAI endpoint
**Fix**: Configured custom OpenRouter provider with createOpenAI()
