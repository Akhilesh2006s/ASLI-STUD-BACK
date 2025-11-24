# How to Use Your Downloaded Ollama Model

## Good News! 🎉

**You don't need to "put" the model anywhere!** Ollama automatically manages models. Once you've downloaded a model using `ollama pull`, it's ready to use.

## Quick Setup Steps

### Step 1: Make Sure Ollama is Running

Ollama should be running as a background service. Check if it's running:

**Option A: Check in Task Manager**
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Look for "Ollama" in the processes list
3. If you see it, Ollama is running! ✅

**Option B: Test via Browser or PowerShell**
- Open browser: http://localhost:11434/api/tags
- Or in PowerShell: `curl http://localhost:11434/api/tags`
- If you see JSON response, Ollama is running! ✅

**If Ollama is NOT running:**
1. Open Start menu
2. Search for "Ollama"
3. Click on "Ollama" to start it
4. Or run in PowerShell: `ollama serve` (keep window open)

### Step 2: Verify Your Model is Downloaded

**If you can run ollama commands:**
```bash
ollama list
```

**If ollama command doesn't work, test via API:**
Open browser: http://localhost:11434/api/tags

You should see your downloaded model in the list.

### Step 3: Configure Your Backend (Optional)

Open your `.env` file in `ASLI-STUD-BACK` folder and make sure you have:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3
```

**Note:** If you downloaded a different model (like `phi3-mini` or `llama3.2:1b`), change `OLLAMA_TEXT_MODEL` to match:

```env
OLLAMA_TEXT_MODEL=phi3-mini
# or
OLLAMA_TEXT_MODEL=llama3.2:1b
# or whatever model you downloaded
```

### Step 4: Start Your Backend Server

```bash
npm start
```

### Step 5: Check Console Output

When your server starts, you should see:

```
🔧 Initializing Ollama service...
📍 Ollama URL: http://localhost:11434
📝 Text Model: llama3
✅ Ollama server is running
📋 Available models: [llama3, ...]
```

**If you see warnings:**
- `⚠️ Text model 'llama3' not found` - Make sure the model name in `.env` matches what you downloaded
- `⚠️ Ollama initialization failed` - Make sure Ollama is running (Step 1)

## How It Works

1. **Ollama stores models automatically** in: `C:\Users\YourUsername\.ollama\models\`
2. **Your backend connects to Ollama** via `http://localhost:11434`
3. **No manual file copying needed!** Ollama handles everything

## Testing

### Test 1: Test Ollama Directly
If you can run ollama commands:
```bash
ollama run llama3 "Hello, what is 2+2?"
```

### Test 2: Test via API
Open browser or use PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -ContentType "application/json" -Body '{"model":"llama3","prompt":"Hello!","stream":false}'
```

### Test 3: Test Your Backend
1. Start your backend: `npm start`
2. Use your frontend to test AI chat
3. Send a message and see if you get AI responses

## Troubleshooting

### Problem: "Model not found" in backend

**Solution:**
1. Check what model you downloaded: `ollama list` (or check in browser: http://localhost:11434/api/tags)
2. Update `.env` file to match the exact model name
3. Restart your backend server

### Problem: "Connection refused"

**Solution:**
1. Make sure Ollama is running (check Task Manager)
2. Start Ollama: Search "Ollama" in Start menu and open it
3. Or run: `ollama serve` in PowerShell (keep window open)

### Problem: Backend can't find Ollama

**Solution:**
1. Verify Ollama is running: http://localhost:11434/api/tags
2. Check `.env` file has: `OLLAMA_BASE_URL=http://localhost:11434`
3. Restart your backend server

## Model Name Reference

Common model names:
- `llama3` - Default, good quality
- `llama3.2:1b` - Smaller, faster
- `phi3-mini` - Alternative option
- `gemma2:2b` - Another option
- `llava:7b` - For image analysis

**Important:** The model name in `.env` must match exactly what you downloaded!

## Summary

✅ **You've already done the hard part** - downloading the model!

Now just:
1. Make sure Ollama is running
2. Set the model name in `.env` (if different from `llama3`)
3. Start your backend: `npm start`
4. Test it!

**No file copying needed - Ollama handles everything automatically!** 🚀



