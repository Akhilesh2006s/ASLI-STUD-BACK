# What to Do After Downloading Ollama

Follow these steps in order:

## Step 1: Verify Ollama is Installed and Running

Open **PowerShell** or **Command Prompt** and run:

```powershell
ollama --version
```

**Expected result:** You should see something like `ollama version is 1.x.x`

If you see an error like "ollama: command not found":
- Close and reopen PowerShell/Command Prompt
- Or restart your computer
- Make sure the installation completed successfully

---

## Step 2: Check if Ollama Service is Running

Test if Ollama is running:

```powershell
curl http://localhost:11434/api/tags
```

**Expected result:** You should see `{"models":[]}` (empty is fine - it means Ollama is running)

**If you get "connection refused" or error:**
- Ollama might not be running
- Check Task Manager (`Ctrl + Shift + Esc`) for "Ollama" process
- If not running, start it:
  ```powershell
  ollama serve
  ```
  (Keep this window open, or it will stop)

---

## Step 3: Download Required AI Models

You need to download at least one model. Run these commands:

### Required: Text Model (for chat, questions, analysis)

```powershell
ollama pull phi3-mini
```

This downloads the `phi3-mini` model (~2.3GB). **Wait for it to complete** - it may take a few minutes depending on your internet speed.

**What you'll see:**
```
pulling manifest
pulling xxxxxx...
pulling xxxxxx...
...
success
```

### Optional: Vision Model (for image analysis)

If you want image analysis features:

```powershell
ollama pull llava:7b
```

This downloads the `llava:7b` model (~4GB). This is optional but recommended.

---

## Step 4: Verify Models are Downloaded

Check what models you have:

```powershell
ollama list
```

**Expected result:** You should see your downloaded models:
```
NAME            ID              SIZE    MODIFIED
phi3-mini       xxxxxx          2.3 GB  xxxxxx
```

---

## Step 5: Test a Model

Test if the model works:

```powershell
ollama run phi3-mini "What is 2+2?"
```

**Expected result:** The model should respond with an answer (may take 5-10 seconds on CPU).

Press `Ctrl+C` to exit the chat.

---

## Step 6: Configure Your Backend (Optional)

Open your `.env` file in the `ASLI-STUD-BACK` folder and add these lines (if not already there):

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=phi3-mini
OLLAMA_VISION_MODEL=llava:7b
```

**Note:** These are optional - the app will use these defaults if not set.

---

## Step 7: Start Your Backend Server

1. **Navigate to your backend folder** (if not already there):
   ```powershell
   cd C:\Users\kaash\Desktop\Asli\ASLI-STUD-BACK
   ```

2. **Install dependencies** (if not already done):
   ```powershell
   npm install
   ```

3. **Start the server**:
   ```powershell
   npm start
   ```

   Or for development with auto-reload:
   ```powershell
   npm run dev
   ```

---

## Step 8: Verify Backend Connected to Ollama

When your server starts, check the console output. You should see:

```
🔧 Initializing Ollama service...
📍 Ollama URL: http://localhost:11434
📝 Text Model: phi3-mini
👁️  Vision Model: llava:7b
✅ Ollama server is running
📋 Available models: [phi3-mini, ...]
```

**If you see warnings:**
- `⚠️ Text model 'phi3-mini' not found` - Run `ollama pull phi3-mini` again
- `⚠️ Ollama initialization failed` - Make sure Ollama is running (Step 2)

---

## Step 9: Test Your Application

1. **Start your frontend** (if you have one)
2. **Test AI Chat feature:**
   - Try sending a message in the AI chat
   - You should get AI responses (may take 2-5 seconds)

3. **Test other AI features:**
   - Question generation
   - Lesson plan generation
   - Image analysis (if you downloaded llava:7b)

---

## Quick Command Checklist

Run these commands in order:

```powershell
# 1. Verify installation
ollama --version

# 2. Check if running
curl http://localhost:11434/api/tags

# 3. Download text model (REQUIRED)
ollama pull phi3-mini

# 4. Download vision model (OPTIONAL)
ollama pull llava:7b

# 5. List models
ollama list

# 6. Test model
ollama run phi3-mini "Hello!"

# 7. Start your backend
cd C:\Users\kaash\Desktop\Asli\ASLI-STUD-BACK
npm start
```

---

## Troubleshooting

### Problem: "ollama: command not found" after installation

**Solution:**
1. Close and reopen PowerShell/Command Prompt
2. Restart your computer
3. Check if Ollama is in PATH (usually automatic)

### Problem: "Connection refused" when testing

**Solution:**
1. Check Task Manager for "Ollama" process
2. If not running, start it:
   ```powershell
   ollama serve
   ```
3. Or restart the service:
   ```powershell
   net stop ollama
   net start ollama
   ```

### Problem: Model download fails or is slow

**Solution:**
- Check your internet connection
- Wait - models are large (2-4GB)
- Try again if it fails

### Problem: Backend shows "model not found"

**Solution:**
1. Verify model is downloaded: `ollama list`
2. If not listed, download it: `ollama pull phi3-mini`
3. Check `.env` file matches the model name

### Problem: Slow AI responses

**Solution:**
- This is normal for CPU inference (2-5 seconds is typical)
- Use smaller models for faster responses:
  ```powershell
  ollama pull llama3.2:1b  # Smaller, faster
  ```

---

## You're Done! ✅

Once you see:
- ✅ Ollama is running
- ✅ Models are downloaded
- ✅ Backend shows "Ollama server is running"
- ✅ AI features work in your app

**Your app is now using local CPU-based AI!** 🎉

---

## Next Steps

- Test all AI features in your application
- Monitor performance
- Adjust models if needed (smaller = faster, larger = better quality)
- See `SETUP_INSTRUCTIONS.md` for more details

