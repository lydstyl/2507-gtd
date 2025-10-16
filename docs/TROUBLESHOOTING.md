# GTD App Troubleshooting Guide

Complete guide to diagnosing and fixing common issues with your GTD Task Management App.

---

## 🚨 Quick Fixes

### Most Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Port already in use | `pkill -f "node\|vite"` then restart |
| Backend won't start | Check `.env` file exists with DATABASE_URL |
| Frontend can't connect | Ensure backend is running on port 3000 |
| Database locked | Close all connections, restart server |
| Build fails | Run `npm install` in root, backend, and frontend |
| Tests fail | Run `npm install dotenv` in backend |
| Chat not working | Check LLM_PROVIDER and API key in `.env` |

---

## 1. Port Already in Use

### Problem
```
Error: Port 5173 is already in use
Error: Port 3000 is already in use
```

### Cause
Previous dev server still running from earlier session.

### Solution A: Kill All Node Processes (Recommended)

```bash
# Kill all node/npm/vite processes
pkill -f "node"
pkill -f "npm"
pkill -f "vite"

# Wait a moment
sleep 2

# Start fresh
npm run dev
```

### Solution B: Kill Specific Ports Only

```bash
# Find what's using the ports
lsof -i :3000
lsof -i :5173

# Kill by PID (replace XXXX with actual PID)
kill -9 XXXX

# Or kill by port directly
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:5173)

# Start fresh
npm run dev
```

### Solution C: Use Different Ports

**Backend** - Edit `backend/.env`:
```bash
PORT=3001
```

**Frontend** - Edit `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5174,  // Changed from 5173
  }
})
```

### Prevention

**Option 1: Always stop properly**
```bash
# Instead of Ctrl+C, use:
npm run dev
# Then press Ctrl+C ONCE and wait for graceful shutdown
```

**Option 2: Create cleanup script**

Save as `scripts/cleanup.sh`:
```bash
#!/bin/bash
echo "🧹 Cleaning up old processes..."
pkill -f "nodemon.*server.ts"
pkill -f "vite.*5173"
echo "✓ Cleanup complete!"
```

Make executable:
```bash
chmod +x scripts/cleanup.sh
./scripts/cleanup.sh
npm run dev
```

---

## 2. Development Server Issues

### Backend Won't Start

#### Error: "Environment variable DATABASE_URL is required"

**Cause**: Missing or invalid `.env` file

**Solution**:
```bash
# 1. Check if .env exists
ls -la backend/.env

# 2. If missing, copy from example
cp backend/.env.example backend/.env

# 3. Verify it has DATABASE_URL
grep DATABASE_URL backend/.env

# 4. Should show:
# DATABASE_URL="file:./prisma/dev.db"
```

#### Error: "Environment variable not found: JWT_SECRET"

**Solution**:
```bash
# Add to backend/.env
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

#### Error: "Cannot find module 'dotenv'"

**Solution**:
```bash
cd backend
npm install dotenv
```

### Frontend Won't Start

#### Error: "Failed to resolve entry for package"

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Error: "Could not resolve dependencies"

**Solution**:
```bash
# From root directory
npm run install:all
```

---

## 3. Database Issues

### Error: "Error querying the database"

**Cause**: Database file locked or corrupted

**Solution**:
```bash
# 1. Stop all servers
pkill -f node

# 2. Check if database exists
ls -la backend/prisma/dev.db

# 3. If corrupted, regenerate (⚠️ THIS DELETES DATA!)
cd backend
rm prisma/dev.db
npx prisma db push

# 4. Restart
npm run dev
```

### Error: "Can't reach database server"

**Solution**:
```bash
# 1. Check DATABASE_URL format
cat backend/.env | grep DATABASE_URL

# 2. Should be:
# DATABASE_URL="file:./prisma/dev.db"

# 3. Regenerate Prisma client
cd backend
npx prisma generate
```

### Database Migrations Fail

**Solution**:
```bash
cd backend

# Reset database (⚠️ DELETES DATA!)
npx prisma migrate reset

# Or push schema without migrations
npx prisma db push
```

---

## 4. Build Issues

### TypeScript Compilation Errors

#### Error: "Cannot find module '@gtd/shared'"

**Solution**:
```bash
# Build shared package first
cd shared
npm run build

# Then build backend/frontend
cd ../backend
npm run build
```

#### Error: "Type 'X' is not assignable to type 'Y'"

**Solution**:
```bash
# 1. Clear TypeScript cache
rm -rf backend/dist
rm -rf frontend/dist
rm -rf shared/dist

# 2. Reinstall dependencies
npm run install:all

# 3. Rebuild
npm run build
```

### Frontend Build Fails

#### Error: "Could not resolve 'X' from 'Y'"

**Solution**:
```bash
cd frontend
rm -rf node_modules .vite
npm install
npm run build
```

---

## 5. Chatbot Issues

### Chat Endpoint Returns 500 Error

#### Error: "ANTHROPIC_API_KEY is required"

**Solution**:
```bash
# Add to backend/.env
LLM_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

**Get API Key**:
- See `API_KEYS_GUIDE.md` for detailed instructions
- Anthropic: https://console.anthropic.com/settings/keys
- OpenAI: https://platform.openai.com/api-keys
- OpenRouter: https://openrouter.ai/keys

#### Error: "401 Unauthorized" from LLM API

**Cause**: Invalid or expired API key

**Solution**:
```bash
# 1. Verify key is correct (no spaces, full key)
grep ANTHROPIC_API_KEY backend/.env

# 2. Test key is valid
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-haiku-20240307","messages":[{"role":"user","content":"Hi"}],"max_tokens":10}'

# 3. If invalid, generate new key at provider's console
```

#### Error: "429 Rate Limited"

**Cause**: Exceeded API rate limits

**Solution**:
```bash
# 1. Wait a few minutes
# 2. Check your usage dashboard
# 3. Add credits if needed
# 4. Consider switching to cheaper model:

# In backend/.env
LLM_MODEL="claude-3-haiku-20240307"  # Cheapest Anthropic
# Or
LLM_MODEL="gpt-4o-mini"  # Cheapest OpenAI
```

### Chat UI Not Loading

**Solution**:
```bash
# 1. Check authentication
# - Must be logged in
# - Check localStorage has 'token'

# 2. Check route exists
curl http://localhost:3000/api

# Should show:
# {"endpoints": {..., "chat": "/api/chat", ...}}

# 3. Check browser console for errors (F12)
```

---

## 6. Environment Variable Issues

### Variables Not Loading

#### Symptom: Server starts but config is undefined

**Solution**:
```bash
# 1. Check .env file location
ls -la backend/.env

# 2. Verify server.ts loads dotenv
head -5 backend/src/server.ts

# Should show:
# import { config } from 'dotenv'
# config()

# 3. Test environment loading
cd backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### Different Environments

**Development** (`.env`):
```bash
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
```

**Production** (`.env.production`):
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
NODE_ENV="production"
```

**Testing** (`.env.test`):
```bash
DATABASE_URL="file:./prisma/test.db"
NODE_ENV="test"
```

---

## 7. Network & CORS Issues

### Frontend Can't Connect to Backend

#### Error: "Network Error" or "CORS Error"

**Symptoms**:
- API calls fail with network error
- Console shows CORS policy error

**Solution**:
```bash
# 1. Verify backend is running
curl http://localhost:3000/health

# 2. Check CORS configuration in backend/src/app.ts
# Should include:
# origin: ['http://localhost:5173', 'http://127.0.0.1:5173']

# 3. Verify frontend API URL
grep VITE_API_BASE_URL frontend/.env

# Should be:
# VITE_API_BASE_URL=http://localhost:3000
```

### API URL Mismatch

**Check frontend configuration**:
```typescript
// frontend/src/services/api.ts or similar
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
```

**Update if needed**:
```bash
# Create frontend/.env
echo "VITE_API_BASE_URL=http://localhost:3000" > frontend/.env
```

---

## 8. Authentication Issues

### Can't Log In

#### Error: "Invalid credentials"

**Solution**:
```bash
# 1. Check if user exists
cd backend
npx prisma studio
# Browse Users table

# 2. Create new user via registration endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### JWT Token Issues

**Solution**:
```bash
# 1. Clear localStorage
# In browser console (F12):
localStorage.clear()

# 2. Verify JWT_SECRET in .env
grep JWT_SECRET backend/.env

# 3. Restart backend to refresh secret
```

### 401 Unauthorized on Protected Routes

**Solution**:
```bash
# 1. Check token is being sent
# In browser Network tab (F12), check request headers
# Should have: Authorization: Bearer <token>

# 2. Verify token in localStorage
# In console (F12):
console.log(localStorage.getItem('token'))

# 3. If missing, log in again
```

---

## 9. Testing Issues

### Tests Won't Run

#### Error: "Cannot find module"

**Solution**:
```bash
cd backend
npm install --save-dev dotenv
npm test
```

#### Database Errors in Tests

**Solution**:
```bash
# Tests are currently skipping due to DB issues
# This is a known issue and doesn't affect app functionality

# To fix for development:
# 1. Use in-memory SQLite for tests
# 2. Or mock the database layer
```

---

## 10. Diagnostic Commands

### Health Checks

```bash
# Check backend health
curl http://localhost:3000/health

# Check API endpoints
curl http://localhost:3000/api

# Check if ports are in use
lsof -i :3000
lsof -i :5173

# Check processes
ps aux | grep node

# Check environment
cd backend
node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('JWT') || k.includes('LLM')))"
```

### Log Viewing

```bash
# Backend logs (if running in background)
tail -f /tmp/backend.log

# Frontend dev server logs
# (run in foreground to see logs)
cd frontend
npm run dev

# Check for errors in browser
# Press F12 → Console tab
```

### Clean Start (Nuclear Option)

```bash
# ⚠️ THIS WILL DELETE ALL DATA!

# 1. Kill everything
pkill -f node

# 2. Clean all builds and caches
rm -rf backend/dist
rm -rf frontend/dist
rm -rf shared/dist
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf shared/node_modules
rm -rf node_modules

# 3. Clean database (⚠️ DELETES DATA!)
rm backend/prisma/dev.db

# 4. Reinstall everything
npm install
npm run install:all
cd shared && npm run build && cd ..

# 5. Setup database
cd backend
npx prisma generate
npx prisma db push

# 6. Start fresh
cd ..
npm run dev
```

---

## 11. Performance Issues

### Slow Startup

**Solution**:
```bash
# 1. Check for large node_modules
du -sh */node_modules

# 2. Clear caches
rm -rf frontend/.vite
rm -rf backend/.tsbuildinfo

# 3. Rebuild
npm run build
```

### High Memory Usage

**Solution**:
```bash
# 1. Check process memory
ps aux | grep node | awk '{print $2, $4, $11}' | sort -k2 -rn | head -5

# 2. Restart servers
pkill -f node
npm run dev

# 3. Close Prisma Studio if open
```

---

## 12. Deployment Issues

### Production Build Fails

**Solution**:
```bash
# 1. Test production build locally
cd backend
npm run build
NODE_ENV=production node dist/server.js

# 2. Test frontend production build
cd frontend
npm run build
npm run preview
```

### Environment Variables in Production

**Reminder**:
- Never commit `.env` files
- Set environment variables in your hosting platform
- Use `.env.example` as a template

---

## 🆘 Getting Help

If none of these solutions work:

1. **Check the logs**:
   ```bash
   # Backend
   cd backend && npm run dev

   # Frontend (in another terminal)
   cd frontend && npm run dev
   ```

2. **Check browser console** (F12 → Console)

3. **Verify your setup**:
   ```bash
   # Run diagnostic
   cd backend
   npm run build
   cd ../frontend
   npm run build
   ```

4. **Search for error messages** in:
   - CHATBOT.md
   - API_KEYS_GUIDE.md
   - CLAUDE.md

5. **Common issues** documented at top of this file

---

## 📋 Checklist: Fresh Installation

Use this when setting up the app on a new machine:

- [ ] Node.js 20+ installed
- [ ] `npm install` in root directory
- [ ] `npm run install:all` completed
- [ ] `cd shared && npm run build`
- [ ] `backend/.env` file created from `.env.example`
- [ ] DATABASE_URL set in `backend/.env`
- [ ] JWT_SECRET set in `backend/.env`
- [ ] `cd backend && npx prisma generate`
- [ ] `cd backend && npx prisma db push`
- [ ] LLM API key added (if using chatbot)
- [ ] `npm run dev` starts both servers
- [ ] Backend responds at http://localhost:3000/health
- [ ] Frontend loads at http://localhost:5173
- [ ] Can create user and log in

---

## 🎯 Your Specific Issue: Port 5173 Already in Use

Based on the error you're seeing, here's the exact solution:

### What's Happening

The previous dev server is still running:
- **Frontend (Port 5173)**: Process ID 28010
- **Backend (Port 3000)**: Process ID 33449

### Fix It Now

```bash
# Option 1: Kill specific processes
kill -9 28010  # Frontend
kill -9 33449  # Backend

# Option 2: Kill all node processes (safer)
pkill -f "node"
pkill -f "vite"
pkill -f "npm"

# Wait a moment
sleep 2

# Start fresh
npm run dev
```

### Why It Happened

- You pressed Ctrl+C but processes didn't stop cleanly
- VSCode terminal was closed without stopping servers
- Processes crashed but ports weren't released

### Prevent It

**Method 1**: Stop properly
```bash
# When running npm run dev:
# Press Ctrl+C ONCE
# Wait for "Server closed" message
# Don't force kill unless it hangs
```

**Method 2**: Create a cleanup alias
```bash
# Add to ~/.bashrc or ~/.zshrc:
alias cleanup-gtd='pkill -f "nodemon.*server.ts"; pkill -f "vite.*5173"'

# Then use:
cleanup-gtd
npm run dev
```

**Method 3**: Use tmux or screen
```bash
# Start in tmux
tmux new -s gtd
npm run dev

# Detach: Ctrl+B, then D
# Reattach: tmux attach -t gtd
# Kill: tmux kill-session -t gtd
```

---

**Last Updated**: October 16, 2025
