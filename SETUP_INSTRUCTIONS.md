# Step-by-Step Setup Instructions

Follow these steps to get your app running with Ollama (CPU-based local AI).

## Step 1: Install Ollama

### For Windows (Your System)

1. **Download Ollama:**
   - Go to: https://ollama.ai/download
   - Click "Download for Windows"
   - The file will be named something like `OllamaSetup.exe`

2. **Install Ollama:**
   - Double-click the downloaded file
   - Follow the installation wizard
   - Ollama will install and start automatically

3. **Verify Installation:**
   - Open PowerShell or Command Prompt
   - Run this command:
     ```powershell
     curl http://localhost:11434/api/tags
     ```
   - If you see a JSON response (even if empty `{"models":[]}`), Ollama is working!

### Alternative: Using PowerShell to verify
```powershell
# Test if Ollama is running
Invoke-WebRequest -Uri http://localhost:11434/api/tags
```

---

## Step 2: Download AI Models

Open PowerShell or Command Prompt and run these commands:

### Required Model (for chat, questions, analysis)

```bash
ollama pull phi3-mini
```

This will download the `phi3-mini` model (~2.3GB). Wait for it to complete.

### Optional: Vision Model (for image analysis)

If you want image analysis features:

```bash
ollama pull llava:7b
```

This will download the `llava:7b` model (~4GB). This is optional but recommended.

### Check Downloaded Models

```bash
ollama list
```

You should see your downloaded models listed.

---

## Step 3: Configure Environment Variables (Optional)

Open your `.env` file in `ASLI-STUD-BACK` folder and add these lines (if not already present):

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=phi3-mini
OLLAMA_VISION_MODEL=llava:7b
```

**Note:** These are optional - the app will use these defaults if not set.

---

## Step 4: Start Your Backend Server

1. **Open Terminal/PowerShell in the backend folder:**
   ```powershell
   cd ASLI-STUD-BACK
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Check the console output:**
   - You should see: `✅ Ollama server is running`
   - You should see: `📋 Available models: [phi3-mini, ...]`
   - If you see warnings about models not found, make sure you ran `ollama pull` in Step 2

---

## Step 5: Test the Setup

### Test 1: Check Ollama is Running
```powershell
curl http://localhost:11434/api/tags
```

### Test 2: Test a Model Directly
```powershell
ollama run phi3-mini "Hello, how are you?"
```

### Test 3: Test Your Backend
- Start your backend server
- Look for Ollama initialization messages in the console
- Try using the AI chat feature in your frontend

---

## Troubleshooting

### Problem: "Ollama not found" or "ollama: command not found"

**Solution:**
- Make sure Ollama is installed
- Restart your terminal/PowerShell after installation
- On Windows, you may need to add Ollama to PATH (usually done automatically)

### Problem: "Connection refused" or "ECONNREFUSED"

**Solution:**
- Make sure Ollama is running
- Check if port 11434 is available
- Try restarting Ollama:
  - Windows: Check Task Manager for "Ollama" process
  - Or restart your computer

### Problem: "Model not found"

**Solution:**
- Run: `ollama pull phi3-mini`
- Check: `ollama list` to see installed models
- Make sure the model name matches your `.env` file

### Problem: Server starts but Ollama not detected

**Solution:**
- Check console logs for Ollama initialization messages
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- The app will still work with fallback responses if Ollama isn't available

### Problem: Slow responses

**Solution:**
- This is normal for CPU inference
- Use smaller models: `ollama pull llama3.2:1b` (faster, smaller)
- Ensure you have enough RAM (4GB+ recommended)
- Close other applications

---

## Quick Command Reference

```bash
# Install Ollama (download from website first)
# Then verify:
curl http://localhost:11434/api/tags

# Download models
ollama pull phi3-mini
ollama pull llava:7b

# List installed models
ollama list

# Test a model
ollama run phi3-mini "What is 2+2?"

# Start your backend
cd ASLI-STUD-BACK
npm start
```

---

## What to Expect

### When Ollama is Working:
- Console shows: `✅ Ollama server is running`
- Console shows: `📋 Available models: [phi3-mini, ...]`
- AI features work with real AI responses
- Responses may take 2-5 seconds (normal for CPU)

### When Ollama is Not Available:
- Console shows: `⚠️ Ollama initialization failed`
- App still works with enhanced fallback responses
- No errors, just uses mock AI responses

---

## Next Steps After Setup

1. ✅ Test AI chat feature
2. ✅ Test image analysis (if you downloaded llava:7b)
3. ✅ Test question generation
4. ✅ Test lesson plan generation
5. ✅ Monitor performance and adjust models if needed

---

## Need Help?

- **Detailed Setup**: See `OLLAMA_SETUP.md`
- **Quick Reference**: See `OLLAMA_QUICK_START.md`
- **Migration Info**: See `MIGRATION_TO_OLLAMA.md`
- **Ollama Docs**: https://ollama.ai/docs

---

**You're all set!** Once Ollama is installed and models are downloaded, your app will use local CPU-based AI instead of external APIs.



