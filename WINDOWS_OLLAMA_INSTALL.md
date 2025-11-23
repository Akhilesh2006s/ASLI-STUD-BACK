# Installing Ollama on Windows - Step by Step

## Method 1: Direct Download (Recommended)

### Step 1: Download Ollama
1. Open your web browser
2. Go to: **https://ollama.ai/download**
3. Click the **"Download for Windows"** button
4. The file `OllamaSetup.exe` will download (usually to your Downloads folder)

### Step 2: Install Ollama
1. Go to your Downloads folder
2. Double-click `OllamaSetup.exe`
3. If Windows asks for permission, click **"Yes"** or **"Run"**
4. Follow the installation wizard:
   - Click **"Install"**
   - Wait for installation to complete
   - Click **"Finish"**

### Step 3: Verify Installation
1. Open **PowerShell** or **Command Prompt**
   - Press `Windows Key + X` and select "Windows PowerShell" or "Terminal"
   - Or search for "PowerShell" in the Start menu

2. Test if Ollama is installed:
   ```powershell
   ollama --version
   ```
   
   You should see something like: `ollama version is 1.x.x`

3. Check if Ollama service is running:
   ```powershell
   curl http://localhost:11434/api/tags
   ```
   
   You should see: `{"models":[]}` (empty is fine, it means Ollama is running)

---

## Method 2: Using Winget (Windows Package Manager)

If you have Windows 11 or Windows 10 with winget:

1. Open PowerShell as Administrator
2. Run:
   ```powershell
   winget install Ollama.Ollama
   ```

---

## Starting Ollama (If Not Running)

### Check if Ollama is Running

**Method 1: Check in Task Manager**
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Look for "Ollama" in the processes list
3. If you see it, Ollama is running!

**Method 2: Test with PowerShell**
```powershell
curl http://localhost:11434/api/tags
```

If you get a response (even an error), Ollama is running. If you get "connection refused", it's not running.

### Start Ollama Manually

**Option 1: Start from Start Menu**
1. Click Start menu
2. Search for "Ollama"
3. Click on "Ollama" app
4. A terminal window will open - keep it open

**Option 2: Start from PowerShell**
```powershell
ollama serve
```
Keep this window open while using Ollama.

**Option 3: Start as Windows Service**
Ollama should start automatically as a service. If it doesn't:

1. Open PowerShell as Administrator
2. Run:
   ```powershell
   net start ollama
   ```

---

## Download Your First Model

Once Ollama is running, download a model:

```powershell
ollama pull phi3-mini
```

This will download the phi3-mini model (~2.3GB). Wait for it to complete.

**Test the model:**
```powershell
ollama run phi3-mini "Hello, what is 2+2?"
```

---

## Troubleshooting

### Problem: "ollama: command not found"

**Solution:**
- Restart your PowerShell/Command Prompt after installation
- Close and reopen the terminal
- Check if Ollama is in your PATH:
  ```powershell
  $env:PATH -split ';' | Select-String -Pattern "ollama"
  ```
- If not found, restart your computer

### Problem: "Connection refused" when testing

**Solution:**
1. Check if Ollama is running:
   - Open Task Manager (`Ctrl + Shift + Esc`)
   - Look for "Ollama" process
   
2. If not running, start it:
   ```powershell
   ollama serve
   ```
   Keep this window open

3. Or restart the service:
   ```powershell
   net stop ollama
   net start ollama
   ```

### Problem: Port 11434 already in use

**Solution:**
1. Find what's using the port:
   ```powershell
   netstat -ano | findstr :11434
   ```
2. Kill the process or change Ollama port (advanced)

### Problem: Installation fails

**Solution:**
1. Run installer as Administrator
2. Disable antivirus temporarily
3. Check Windows Defender isn't blocking it
4. Try downloading again from the website

---

## Verify Everything is Working

Run these commands in PowerShell:

```powershell
# 1. Check Ollama version
ollama --version

# 2. Check if service is running
curl http://localhost:11434/api/tags

# 3. List models (should be empty initially)
ollama list

# 4. Download a test model
ollama pull phi3-mini

# 5. Test the model
ollama run phi3-mini "Hello!"
```

---

## Next Steps

Once Ollama is installed and running:

1. ✅ Download models (see Step 2 in main setup)
2. ✅ Configure your backend (see Step 3 in main setup)
3. ✅ Start your server (see Step 4 in main setup)

---

## Quick Reference

```powershell
# Install Ollama
# Download from https://ollama.ai/download

# Check if running
curl http://localhost:11434/api/tags

# Start Ollama (if not running)
ollama serve

# Download model
ollama pull phi3-mini

# Test model
ollama run phi3-mini "Test message"

# List models
ollama list
```

---

**Need more help?** Check `SETUP_INSTRUCTIONS.md` for complete setup guide.

