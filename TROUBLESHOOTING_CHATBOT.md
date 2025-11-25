# Troubleshooting: Chatbot Not Using Ollama

## Problem: Chatbot Not Answering with Ollama

### Common Issues and Solutions

## Issue 1: Model Not Found

**Symptom:** 
- Console shows: `⚠️ Text model 'llama3' not found`
- Chatbot uses fallback responses instead of Ollama

**Solution:**
You need to download the text model. You currently only have `llava:7b` (vision model).

**Download llama3:**
```bash
ollama pull llama3
```

**Or use a different model you have:**
Update your `.env` file:
```env
OLLAMA_TEXT_MODEL=llava:7b
```
(Note: llava:7b is a vision model, not ideal for text, but will work)

**Better option - download a text model:**
```bash
ollama pull llama3
# or
ollama pull phi3-mini
# or
ollama pull llama3.2:1b
```

## Issue 2: Ollama Not Running

**Symptom:**
- Console shows: `⚠️ Ollama initialization failed`
- Connection refused errors

**Solution:**
1. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. If not running, start Ollama:
   - Windows: Search "Ollama" in Start menu and open it
   - Or run: `ollama serve` (keep window open)

## Issue 3: Service Not Initialized

**Symptom:**
- `isAvailable` is false
- Always uses fallback

**Check:**
Look at your server console when it starts. You should see:
```
🔧 Initializing Ollama service...
✅ Ollama server is running
📋 Available models: [llama3, ...]
```

**If you see warnings:**
- Model not found → Download the model
- Connection failed → Start Ollama

## Issue 4: Wrong Model Name

**Symptom:**
- Model exists but name doesn't match exactly

**Solution:**
Check exact model name:
```bash
ollama list
```

Update `.env` to match exactly:
```env
OLLAMA_TEXT_MODEL=llama3:latest
# or whatever exact name you see in ollama list
```

## Quick Diagnostic Steps

### Step 1: Check Ollama Status
```bash
curl http://localhost:11434/api/tags
```

### Step 2: Check Available Models
```bash
ollama list
```

### Step 3: Test Model Directly
```bash
ollama run llama3 "Hello, test message"
```

### Step 4: Check Backend Console
When you start your server, look for:
- ✅ `Ollama server is running`
- ✅ `Available models: [...]`
- ⚠️ Any warnings about missing models

### Step 5: Check .env File
Make sure you have (in `ASLI-STUD-BACK/.env`):
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3
```

## Expected Console Output

**When working correctly:**
```
🔧 Initializing Ollama service...
📍 Ollama URL: http://localhost:11434
📝 Text Model: llama3
👁️  Vision Model: llava:7b
✅ Ollama server is running
📋 Available models: ['llama3', 'llava:7b']
```

**When model missing:**
```
🔧 Initializing Ollama service...
📍 Ollama URL: http://localhost:11434
📝 Text Model: llama3
⚠️  Text model 'llama3' not found. Run: ollama pull llama3
✅ Ollama server is running
📋 Available models: ['llava:7b']
```

**When Ollama not running:**
```
🔧 Initializing Ollama service...
📍 Ollama URL: http://localhost:11434
⚠️  Ollama initialization failed: fetch failed
💡 Make sure Ollama is installed and running on http://localhost:11434
```

## Testing the Fix

After fixing the issue:

1. **Restart your backend server:**
   ```bash
   npm start
   ```

2. **Check console for:**
   - ✅ `Ollama server is running`
   - ✅ No warnings about missing models

3. **Test chatbot:**
   - Send a message
   - Check console for: `🤖 Using Ollama for response...`
   - Should NOT see: `🔄 Using enhanced fallback service...`

4. **Verify response:**
   - Response should be AI-generated (not template)
   - Takes 3-8 seconds (normal for llama3)

## Most Likely Issue

Based on your setup, you probably need to:

1. **Download llama3 model:**
   ```bash
   ollama pull llama3
   ```

2. **Restart your backend:**
   ```bash
   npm start
   ```

3. **Check console** - should now show llama3 in available models

## Still Not Working?

1. Check server console logs for errors
2. Verify Ollama is running: `curl http://localhost:11434/api/tags`
3. Verify model exists: `ollama list`
4. Check `.env` file has correct model name
5. Restart both Ollama and your backend server

