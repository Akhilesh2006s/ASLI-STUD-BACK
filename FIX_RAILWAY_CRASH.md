# Fix: Railway Deployment Crash - "node: command not found"

## Problem
Railway deployment is crashing with error: `/bin/bash: line 1: node: command not found`

## Root Cause
The startup script or Railway configuration is trying to run `node` before Node.js is properly set up in the PATH, or the start command is overriding Railway's default Node.js setup.

## Solution Applied

### 1. Fixed Startup Script
Updated `start-with-ollama.sh` to:
- Find Node.js in common locations
- Handle cases where Ollama isn't available
- Fall back gracefully if Ollama fails

### 2. Simplified Railway Config
- Removed custom build command that might interfere
- Let Railway auto-detect Node.js from `package.json`
- Use default start command: `node index.js`

### 3. Updated Nixpacks Config
- Made Ollama installation optional (won't crash if it fails)
- Railway will auto-detect Node.js

## Quick Fix for Railway Dashboard

### Option 1: Use Default Start Command (Recommended)

In Railway Dashboard → Settings → Start Command:
```
node index.js
```

**Remove any custom start command** that uses the bash script for now.

### Option 2: If You Want Ollama

1. **First, make sure basic deployment works:**
   - Set Start Command to: `node index.js`
   - Deploy and verify it works

2. **Then add Ollama:**
   - Set Start Command to: `bash start-with-ollama.sh`
   - Make sure Ollama is installed in build phase

## Immediate Fix Steps

### Step 1: Update Railway Start Command

1. Go to Railway Dashboard
2. Select your service → Settings
3. **Start Command**: Change to:
   ```
   node index.js
   ```
4. **Remove** any reference to `start-with-ollama.sh` for now

### Step 2: Deploy

1. Push changes or trigger redeploy
2. Check logs - should see Node.js starting
3. Should NOT see "node: command not found"

### Step 3: Verify Basic Deployment Works

1. Check Railway logs - should see your app starting
2. Test an API endpoint
3. Verify it's not crashing

### Step 4: Add Ollama Later (Optional)

Once basic deployment works:
1. Add Ollama installation to build phase
2. Update start command to include Ollama
3. Or use external Ollama service

## Alternative: Skip Ollama for Now

If Ollama is causing issues, you can:

1. **Use fallback responses** (already implemented)
2. **Set environment variable** to disable Ollama:
   ```
   DISABLE_OLLAMA=true
   ```
3. **Or use external AI API** temporarily

## Files Updated

1. ✅ `start-with-ollama.sh` - Better Node.js detection
2. ✅ `railway.json` - Simplified config
3. ✅ `nixpacks.toml` - Made Ollama optional

## Next Steps

1. **Update Railway Start Command** to: `node index.js`
2. **Deploy** and verify it works
3. **Test** your API endpoints
4. **Add Ollama later** if needed

---

**The crash should be fixed now. Update Railway start command to `node index.js` and redeploy!**

