# API Keys Setup Guide

This guide explains how to get API keys for the three supported LLM providers in your GTD chatbot.

---

## 🔑 Anthropic Claude API

### Important: Pro Plan vs API Access

**⚠️ CRITICAL:** The Anthropic **Pro Plan** ($20/month for claude.ai) is **NOT the same** as API access!

- **Pro Plan**: Subscription for using claude.ai web interface
- **API Access**: Separate pay-as-you-go pricing for developers

### Getting Your Anthropic API Key

1. **Create an Account**
   - Go to: https://console.anthropic.com/
   - Sign up for a free account (no credit card required initially)

2. **Add Credits**
   - Navigate to: https://console.anthropic.com/settings/billing
   - Click "Add Credits" or "Purchase Credits"
   - Minimum purchase is typically $5
   - Credits never expire

3. **Create API Key**
   - Go to: https://console.anthropic.com/settings/keys
   - Click "Create Key"
   - Give it a descriptive name (e.g., "GTD Chatbot")
   - **Copy the key immediately** (you won't see it again!)
   - Format: `sk-ant-api03-...`

4. **Add to Your .env File**
   ```bash
   LLM_PROVIDER="anthropic"
   ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
   ```

### Anthropic Pricing (Pay-as-you-go)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|------------------------|----------|
| **Claude Haiku 3.5** | $0.80 | $4 | **Fastest, cheapest** |
| Claude Sonnet 4 | $3 | $15 | **Recommended** - Best balance |
| Claude Opus 4.1 | $15 | $75 | Most capable |

**Typical Usage for Your Chatbot:**
- Creating a task: ~500 input tokens + ~100 output tokens
- Listing tasks: ~600 input tokens + ~300 output tokens
- **Cost per conversation**: ~$0.001 - $0.005 (less than a cent!)

**Recommended Starting Budget:** $5 credits = thousands of conversations

### Pricing Calculator
https://www.anthropic.com/pricing#api

---

## 🔑 OpenAI API

### Getting Your OpenAI API Key

1. **Create an Account**
   - Go to: https://platform.openai.com/signup
   - Sign up with email or Google/Microsoft account

2. **Add Payment Method**
   - Go to: https://platform.openai.com/account/billing
   - Add a credit card
   - Set a usage limit (recommended: $5-10/month)

3. **Create API Key**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Name it (e.g., "GTD Chatbot")
   - **Copy the key immediately** (you won't see it again!)
   - Format: `sk-proj-...` or `sk-...`

4. **Add to Your .env File**
   ```bash
   LLM_PROVIDER="openai"
   OPENAI_API_KEY="sk-proj-your-key-here"
   ```

### OpenAI Pricing (Pay-as-you-go)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|------------------------|----------|
| **GPT-4o mini** | $0.15 | $0.60 | **Fastest, cheapest** |
| GPT-4o | $2.50 | $10.00 | **Recommended** - Great quality |
| GPT-4 Turbo | $10.00 | $30.00 | Most capable |

**Typical Usage for Your Chatbot:**
- Similar to Anthropic
- **Cost per conversation**: ~$0.0005 - $0.003 (less than a cent!)

**Free Trial:**
- New accounts get $5 free credits (expires after 3 months)

### Pricing Calculator
https://openai.com/api/pricing/

---

## 🔑 OpenRouter API

### What is OpenRouter?

OpenRouter is a **unified API gateway** that gives you access to **500+ models** from multiple providers (Anthropic, OpenAI, Google, Meta, etc.) through a single API key.

**Benefits:**
- ✅ One API key for all models
- ✅ Competitive pricing (often cheaper than direct)
- ✅ Automatic fallback if a model is down
- ✅ 1,000,000 free "Bring Your Own Key" requests/month

### Getting Your OpenRouter API Key

1. **Create an Account**
   - Go to: https://openrouter.ai/
   - Click "Sign In" → Sign up with Google/GitHub/Discord

2. **Get Your API Key**
   - Go to: https://openrouter.ai/keys
   - Click "Create Key"
   - Name it (e.g., "GTD Chatbot")
   - **Copy the key immediately**
   - Format: `sk-or-v1-...`

3. **Add Credits (Optional)**
   - Go to: https://openrouter.ai/credits
   - Add $5-10 to get started
   - OR use "Bring Your Own Key" mode (free for 1M requests/month)

4. **Add to Your .env File**
   ```bash
   LLM_PROVIDER="openrouter"
   OPENROUTER_API_KEY="sk-or-v1-your-key-here"
   LLM_MODEL="anthropic/claude-3.5-sonnet"  # Or any model you prefer
   ```

### OpenRouter Pricing

OpenRouter offers access to all models at competitive rates:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| anthropic/claude-3.5-haiku | $0.80 | $4.00 |
| anthropic/claude-3.5-sonnet | $3.00 | $15.00 |
| openai/gpt-4o-mini | $0.15 | $0.60 |
| openai/gpt-4o | $2.50 | $10.00 |
| google/gemini-pro-1.5 | $0.00 | $0.00 (Free!) |
| meta-llama/llama-3.1-8b | $0.05 | $0.05 |

**Full pricing:** https://openrouter.ai/models

### Free Tier: Bring Your Own Key (BYOK)

OpenRouter offers **1,000,000 free requests per month** when you use their "Bring Your Own Key" feature:
- Add your own Anthropic/OpenAI API keys to OpenRouter
- Use OpenRouter's interface for free
- Only pay the underlying provider's rates

---

## 💡 Which Provider Should You Choose?

### Recommended for Beginners: **OpenAI (GPT-4o mini)**
- ✅ Easiest to set up
- ✅ $5 free trial credits
- ✅ Very cheap ($0.15 per 1M input tokens)
- ✅ Fast and reliable
- ⚠️ Slightly less capable than Claude for complex tasks

### Recommended for Best Quality: **Anthropic (Claude Sonnet 4)**
- ✅ Best for conversational AI
- ✅ Excellent at tool calling
- ✅ Great balance of quality and price
- ⚠️ No free tier (must add credits upfront)

### Recommended for Flexibility: **OpenRouter**
- ✅ Access to all models with one API key
- ✅ 1M free requests/month with BYOK
- ✅ Easy to switch between models
- ✅ Automatic fallbacks
- ⚠️ Slightly more complex to configure

---

## 🔒 Security Best Practices

1. **Never commit API keys to git**
   - Keys are in `.env` (which is in `.gitignore`)
   - Never share your `.env` file

2. **Set usage limits**
   - Anthropic: Set budget alerts in console
   - OpenAI: Set hard/soft limits in billing settings
   - OpenRouter: Set spending limits

3. **Rotate keys regularly**
   - Delete old keys you're not using
   - Create new keys every few months

4. **Monitor usage**
   - Check your provider's dashboard weekly
   - Watch for unexpected spikes

---

## 🧪 Testing Your Setup

After adding your API key:

1. **Restart the backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Open the chat** at http://localhost:5173/chat

3. **Test with a simple message**:
   ```
   "Create a task to test the chatbot"
   ```

4. **Check for errors**:
   - Browser console (F12)
   - Backend terminal logs

---

## 💰 Cost Examples

### Example 1: Light Usage (50 conversations/month)
- **Anthropic (Sonnet 4)**: ~$0.15/month
- **OpenAI (GPT-4o mini)**: ~$0.05/month
- **OpenRouter (various)**: ~$0.03-0.15/month

### Example 2: Heavy Usage (500 conversations/month)
- **Anthropic (Sonnet 4)**: ~$1.50/month
- **OpenAI (GPT-4o)**: ~$0.75/month
- **OpenRouter (Gemini Pro)**: $0.00 (free model!)

**Bottom line:** Even with heavy use, you'll spend less than $5/month!

---

## 🆘 Troubleshooting

### Error: "ANTHROPIC_API_KEY is required"
- Check that your `.env` file has the key
- Restart the backend server
- Make sure the key starts with `sk-ant-`

### Error: "401 Unauthorized"
- Your API key is invalid or expired
- Create a new key in the provider's console
- Make sure you copied the entire key

### Error: "429 Rate Limited"
- You've exceeded your rate limit
- Wait a few minutes and try again
- Consider upgrading your plan or adding more credits

### Error: "Insufficient credits"
- **Anthropic**: Add more credits at console.anthropic.com/settings/billing
- **OpenAI**: Add payment method at platform.openai.com/account/billing
- **OpenRouter**: Add credits at openrouter.ai/credits

---

## 📚 Additional Resources

### Anthropic
- Console: https://console.anthropic.com/
- Documentation: https://docs.anthropic.com/
- Pricing: https://www.anthropic.com/pricing#api
- API Keys: https://console.anthropic.com/settings/keys

### OpenAI
- Platform: https://platform.openai.com/
- Documentation: https://platform.openai.com/docs
- Pricing: https://openai.com/api/pricing/
- API Keys: https://platform.openai.com/api-keys

### OpenRouter
- Homepage: https://openrouter.ai/
- Documentation: https://openrouter.ai/docs
- Models & Pricing: https://openrouter.ai/models
- API Keys: https://openrouter.ai/keys

---

## ✅ Quick Start Checklist

- [ ] Choose your provider (Anthropic, OpenAI, or OpenRouter)
- [ ] Create an account on the provider's platform
- [ ] Add payment method / credits (if required)
- [ ] Generate an API key
- [ ] Copy the API key to `backend/.env`
- [ ] Set `LLM_PROVIDER` in `backend/.env`
- [ ] Restart the backend server
- [ ] Test the chatbot at `/chat`
- [ ] Set usage limits/alerts
- [ ] Bookmark the provider's console for monitoring

---

**Need help?** Check the main [CHATBOT.md](./CHATBOT.md) documentation or the [CHATBOT_QUICK_START.md](./CHATBOT_QUICK_START.md) guide.
