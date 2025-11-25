# Railway Ollama Quick Setup Guide

## 🚀 Quick Setup Steps

### Step 1: Railway Dashboard Configuration

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Login and select your project
   - Click on your backend service

2. **Set Environment Variables:**
   Go to **Variables** tab and add:
   ```
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_TEXT_MODEL=llama3.2:1b
   OLLAMA_VISION_MODEL=llava:7b
   ```

3. **Update Start Command:**
   Go to **Settings** → **Start Command** and set:
   ```bash
   bash start-with-ollama.sh
   ```
   
   Or if bash doesn't work:
   ```bash
   ollama serve & sleep 10 && ollama pull llama3.2:1b && node index.js
   ```

4. **Increase Resources:**
   - Go to **Settings** → **Resources**
   - **Memory**: Set to at least 4GB (8GB recommended)
   - **CPU**: Maximum available
   - ⚠️ Free tier may not be enough!

### Step 2: Deploy

1. **Push changes to your repo** (if connected to Railway)
2. **Or trigger redeploy** in Railway dashboard
3. **Monitor deployment logs**

### Step 3: Verify

1. **Check Railway Logs:**
   Should see:
   ```
   🚀 Starting Railway backend with Ollama...
   📦 Starting Ollama service...
   ✅ Ollama is running
   📥 Downloading llama3.2:1b model...
   ✅ Model already exists
   🚀 Starting Node.js application...
   ```

2. **Test Chatbot:**
   - Send a message
   - Check logs for: `🤖 Attempting to use Ollama for response...`
   - Should get AI responses (not templates)

## ⚠️ Important Notes

### Railway Free Tier Limitations:
- **Memory**: Usually 512MB-1GB (not enough for Ollama)
- **CPU**: Limited
- **Disk**: Limited

**Solution:** Upgrade Railway plan or use external Ollama service

### Recommended Model:
Use `llama3.2:1b` (1.1GB) instead of `llama3` (4.7GB):
- Faster responses
- Less memory usage
- Better for Railway

## 🔧 Alternative: External Ollama Service

If Railway doesn't have enough resources:

1. **Run Ollama on VPS** (DigitalOcean, Linode, etc.)
2. **Set Railway environment variable:**
   ```
   OLLAMA_BASE_URL=https://your-vps-ip:11434
   ```
3. **No need to install Ollama on Railway**

## 📋 Files to Commit

Make sure these files are in your repo:
- ✅ `start-with-ollama.sh`
- ✅ `railway.json`
- ✅ `nixpacks.toml` (optional)

## 🧪 Testing Checklist

- [ ] Railway environment variables set
- [ ] Start command updated
- [ ] Resources increased (if possible)
- [ ] Deployment successful
- [ ] Ollama starts in logs
- [ ] Model downloads (or exists)
- [ ] Chatbot uses Ollama (not fallback)
- [ ] Responses are AI-generated

---

**See `RAILWAY_OLLAMA_SETUP.md` for detailed instructions!**

