# Railway Deployment Fix - Immediate Steps

## 🚨 Current Issue
Railway deployment crashing with: `node: command not found`

## ✅ Quick Fix (Do This Now)

### Step 1: Update Railway Start Command

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Select your project → ASLI-STUD-BACK service
   - Click **Settings**

2. **Update Start Command:**
   - Find **"Start Command"** field
   - **Change it to:**
     ```
     node index.js
     ```
   - **Remove** any bash script references
   - **Save**

### Step 2: Verify Environment Variables

Make sure these are set in Railway → Variables:
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000 (or leave empty - Railway sets it)
```

### Step 3: Deploy

1. **Trigger redeploy:**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on latest deployment
   - Or push a commit to trigger auto-deploy

2. **Watch logs:**
   - Should see: `Server running on port...`
   - Should NOT see: `node: command not found`

## ✅ What I Fixed

1. **Updated startup script** - Better Node.js detection
2. **Simplified Railway config** - Let Railway auto-detect Node.js
3. **Made Ollama optional** - Won't crash if Ollama isn't available
4. **Added graceful fallback** - App works without Ollama

## 🔧 For Ollama Later

Once basic deployment works:

### Option A: Add Ollama to Railway
1. Update Start Command to: `bash start-with-ollama.sh`
2. Make sure Ollama installs in build phase
3. Increase Railway resources (memory/CPU)

### Option B: Use External Ollama
1. Run Ollama on VPS
2. Set Railway variable: `OLLAMA_BASE_URL=https://your-vps:11434`
3. No need to install Ollama on Railway

### Option C: Disable Ollama
Set Railway variable:
```
DISABLE_OLLAMA=true
```
App will use fallback responses (no AI, but works).

## 📋 Verification Checklist

After fixing start command:

- [ ] Railway logs show: `Server running on port...`
- [ ] No "node: command not found" errors
- [ ] API endpoints respond
- [ ] Chatbot works (with fallback if Ollama not available)

## 🚀 Next Steps

1. ✅ **Update Railway Start Command** → `node index.js`
2. ✅ **Redeploy**
3. ✅ **Verify it works**
4. ⏳ **Add Ollama later** (optional)

---

**The fix is simple: Change Railway Start Command to `node index.js` and redeploy!**

