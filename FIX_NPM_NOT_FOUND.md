# Fix: npm: command not found in Railway

## Problem
Railway build is failing with: `/bin/bash: line 1: npm: command not found`

## Root Cause
Railway is trying to use a Dockerfile that doesn't have Node.js/npm installed, or Railway is auto-generating a Dockerfile incorrectly.

## Solutions Applied

### Solution 1: Force Nixpacks (Recommended)

Railway should use **Nixpacks** which auto-detects Node.js from `package.json`.

**In Railway Dashboard:**
1. Go to **Settings** → **Build**
2. **Builder**: Select **"Nixpacks"** (not Docker)
3. **Save**

### Solution 2: Created Proper Dockerfile

I've created a `Dockerfile` with Node.js 18 as base image. This will work if Railway uses Docker.

### Solution 3: Remove Dockerfile (If Nixpacks Preferred)

If you want to force Nixpacks:
1. Delete or rename `Dockerfile` (if it exists)
2. Railway will use Nixpacks automatically
3. Nixpacks detects Node.js from `package.json`

## Quick Fix Steps

### Option A: Use Nixpacks (Easiest)

1. **Railway Dashboard** → Your Service → **Settings**
2. **Build** section → **Builder**: Select **"Nixpacks"**
3. **Save**
4. **Redeploy**

Nixpacks will:
- Auto-detect Node.js from `package.json`
- Run `npm install` automatically
- Use `node index.js` as start command

### Option B: Use Dockerfile

The `Dockerfile` I created will work:
- Uses `node:18-alpine` base image
- Installs dependencies
- Starts with `node index.js`

Railway should detect and use it automatically.

## Verify Fix

After redeploying, check build logs:
- ✅ Should see: `npm install` running successfully
- ✅ Should see: `node index.js` starting
- ❌ Should NOT see: `npm: command not found`

## If Still Failing

1. **Check Railway Settings:**
   - Builder should be "Nixpacks" or "Docker"
   - Start Command should be: `node index.js`

2. **Check package.json:**
   - Should have `"engines": { "node": ">=18.0.0" }` ✅ (already has it)

3. **Force Nixpacks:**
   - Delete `Dockerfile` temporarily
   - Railway will use Nixpacks
   - Redeploy

---

**The Dockerfile is now created. Railway should use it, or switch to Nixpacks in Settings!**

