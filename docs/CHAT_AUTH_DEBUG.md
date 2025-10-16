# Chatbot Authentication Debug Guide

## Problem: "User not authenticated" Error

When trying to use the chatbot, you get a 401 error with message: `{"error":"User not authenticated"}`

---

## Step-by-Step Diagnosis

### Step 1: Check if You're Logged In

Open browser console (F12) and run:

```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token'))

// Check if user data exists
console.log('User:', localStorage.getItem('user'))
```

**Expected Output**:
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (long string)
User: {"id":"...","email":"..."}
```

**If token is `null`**:
- ❌ You're not logged in
- ✅ **Solution**: Go to `/login` and log in first

---

### Step 2: Verify Token is Being Sent

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try sending a chat message
4. Click on the `/api/chat` request
5. Go to **Headers** tab
6. Check **Request Headers** section

**Should see**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If missing Authorization header**:
- ❌ Frontend isn't sending the token
- ✅ **Solution**: See Step 3

---

### Step 3: Check Frontend Code

The ChatInterface component should have:

```typescript
headers: async () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}
```

**If this code is missing**:
- Rebuild frontend: `cd frontend && npm run build`
- Or restart dev server: `cd frontend && npm run dev`

---

### Step 4: Test Token Validity

Check if your token is still valid:

```bash
# Replace YOUR_TOKEN with actual token from localStorage
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/tasks

# Should return your tasks, not an error
```

**If returns 401 Unauthorized**:
- ❌ Token is expired or invalid
- ✅ **Solution**: Log out and log back in

---

### Step 5: Verify Backend Auth Middleware

Check backend logs when you send a chat message:

```bash
# In backend terminal, you should see:
# POST /api/chat
# If no log appears, request isn't reaching backend
```

**If no log appears**:
- Check backend is running: `curl http://localhost:3000/health`
- Check frontend is using correct URL: Should be `http://localhost:3000`

---

## Quick Fixes

### Fix 1: Log Out and Log In Again

```javascript
// In browser console (F12):
localStorage.clear()
// Then go to /login and log in again
```

### Fix 2: Check You're on the Right Page

The chat is at: **http://localhost:5173/chat**

Not at:
- ❌ http://localhost:5173/
- ❌ http://localhost:5173/tasks
- ❌ http://localhost:5173/dashboard

### Fix 3: Rebuild Frontend

```bash
cd frontend
rm -rf node_modules/.vite dist
npm run build
npm run dev
```

### Fix 4: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

## Common Scenarios

### Scenario 1: "I just installed the app"

**Problem**: No user account exists yet

**Solution**:
```bash
# 1. Go to http://localhost:5173/register
# 2. Create an account
# 3. Log in
# 4. Then go to http://localhost:5173/chat
```

### Scenario 2: "I was logged in before but now getting 401"

**Problem**: JWT token expired (default: 7 days)

**Solution**:
```javascript
// Clear and re-login
localStorage.clear()
// Go to /login
```

### Scenario 3: "Token exists but still getting 401"

**Problem**: Token format or JWT_SECRET mismatch

**Solution**:
```bash
# 1. Check backend/.env has JWT_SECRET
grep JWT_SECRET backend/.env

# 2. Restart backend
cd backend
npm run dev

# 3. Log out and log in again
```

### Scenario 4: "Authorization header not showing in Network tab"

**Problem**: Headers function not being called

**Solution**:
```bash
# Update the ChatInterface.tsx component
# Make sure it has the updated headers code
# Then restart frontend:
cd frontend
npm run dev
```

---

## Diagnostic Script

Run this in browser console (F12) for a full diagnostic:

```javascript
(function() {
  console.log('=== GTD Chat Authentication Diagnostic ===');

  // Check token
  const token = localStorage.getItem('token');
  console.log('1. Token exists:', !!token);
  if (token) {
    console.log('   Token preview:', token.substring(0, 50) + '...');

    // Check token structure
    try {
      const parts = token.split('.');
      console.log('   Token parts:', parts.length === 3 ? '✓ Valid JWT structure' : '✗ Invalid structure');

      // Decode payload (not verified, just for inspection)
      const payload = JSON.parse(atob(parts[1]));
      console.log('   User ID:', payload.userId);
      console.log('   Issued at:', new Date(payload.iat * 1000));
      console.log('   Expires at:', new Date(payload.exp * 1000));
      console.log('   Expired:', new Date(payload.exp * 1000) < new Date() ? '✗ YES' : '✓ NO');
    } catch (e) {
      console.log('   ✗ Error decoding token:', e.message);
    }
  }

  // Check user
  const user = localStorage.getItem('user');
  console.log('2. User data exists:', !!user);
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('   User email:', userData.email);
      console.log('   User ID:', userData.id);
    } catch (e) {
      console.log('   ✗ Error parsing user data');
    }
  }

  // Check API URL
  console.log('3. API Base URL:', 'http://localhost:3000');

  // Test backend connectivity
  fetch('http://localhost:3000/health')
    .then(r => r.json())
    .then(d => console.log('4. Backend health:', '✓', d))
    .catch(e => console.log('4. Backend health:', '✗', e.message));

  // Test authenticated endpoint
  if (token) {
    fetch('http://localhost:3000/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => {
        console.log('5. Auth test status:', r.status);
        return r.json();
      })
      .then(d => console.log('   Auth test result:', r.status === 200 ? '✓ Authorized' : '✗ Unauthorized', d))
      .catch(e => console.log('5. Auth test:', '✗', e.message));
  } else {
    console.log('5. Auth test: ⊘ Skipped (no token)');
  }

  console.log('=== End Diagnostic ===');
})();
```

---

## Still Not Working?

1. **Check browser console** (F12) for errors
2. **Check backend logs** for authentication errors
3. **Verify you're logged in** at `/login`
4. **Check token exists** in localStorage
5. **Try incognito mode** to rule out cache issues
6. **See full troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Expected Flow

```
1. User visits /chat
   ↓
2. ChatPage checks authentication
   ↓
3. If not authenticated → Redirect to /login
   ↓
4. User logs in → Token saved to localStorage
   ↓
5. User goes to /chat
   ↓
6. ChatInterface reads token from localStorage
   ↓
7. Sends request with Authorization: Bearer <token>
   ↓
8. Backend validates token with JWT_SECRET
   ↓
9. If valid → Process chat request
   ↓
10. Return streaming response
```

**Current failure point**: Step 7 or 8
- Token not being sent (Step 7)
- Token invalid/expired (Step 8)

---

## ✅ RESOLVED ISSUE: ChatController userId Bug

**Issue**: "User not authenticated" error even with valid token

**Root Cause**: ChatController was using `(req as any).userId` instead of `(req as any).user?.userId`

**Fix Applied**: Updated [ChatController.ts:11](backend/src/presentation/controllers/ChatController.ts#L11) to match the pattern used in all other controllers.

**Before**:
```typescript
const userId = (req as any).userId  // ❌ Incorrect - always undefined
```

**After**:
```typescript
const userId = (req as any).user?.userId  // ✅ Correct - matches authMiddleware
```

**Status**: Fixed in commit [current]. Backend rebuilt successfully.

**Testing**: Restart backend (`cd backend && npm run dev`) and try the chatbot again.

---

**Last Updated**: October 16, 2025
