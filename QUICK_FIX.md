# Quick Fix: Port Already in Use

## Your Error
```
Error: Port 5173 is already in use
```

## What's Wrong

Previous dev servers are still running:
- **Port 5173** (Frontend) - Process ID: 28010
- **Port 3000** (Backend) - Process ID: 33449

## Fix It Right Now

Choose one method:

### Method 1: Use the Cleanup Script (Easiest)

```bash
./scripts/cleanup-ports.sh
npm run dev
```

### Method 2: Manual Cleanup

```bash
# Kill the old processes
kill -9 28010
kill -9 33449

# Or kill all node processes
pkill -f node

# Wait a moment
sleep 2

# Start fresh
npm run dev
```

### Method 3: Kill All Node/NPM/Vite

```bash
pkill -f "node"
pkill -f "npm"
pkill -f "vite"
sleep 2
npm run dev
```

## Why This Happened

- You pressed Ctrl+C but the processes didn't stop cleanly
- Terminal was closed without stopping the servers
- Processes crashed but didn't release the ports

## Prevent It Next Time

**Option 1: Stop Properly**
- When you press Ctrl+C, press it **only once**
- Wait for the "Server closed" message
- Don't force kill unless it hangs for >10 seconds

**Option 2: Always Use the Cleanup Script**
```bash
# Before starting dev:
./scripts/cleanup-ports.sh
npm run dev
```

**Option 3: Create an Alias**
```bash
# Add to your ~/.bashrc or ~/.zshrc:
alias gtd-clean='cd ~/apps/2507-gtd && ./scripts/cleanup-ports.sh'
alias gtd-dev='cd ~/apps/2507-gtd && ./scripts/cleanup-ports.sh && npm run dev'

# Then just run:
gtd-dev
```

## Still Not Working?

See the full **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** guide for:
- Database issues
- Build errors
- Environment variable problems
- Chat/API issues
- And more...

## Check If Ports Are Free

```bash
# Check if anything is using the ports
lsof -i :3000
lsof -i :5173

# If empty output, ports are free ✓
# If you see processes, kill them first
```

---

**Quick Reference**:
- Cleanup script: `./scripts/cleanup-ports.sh`
- Full guide: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Chatbot issues: [CHATBOT.md](./CHATBOT.md)
