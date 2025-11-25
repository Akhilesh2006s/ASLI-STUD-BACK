# Setting Up Ollama on Railway Backend

## ⚠️ Important Considerations

**Railway Limitations:**
- Railway containers have limited resources
- Ollama models are large (4-7GB+)
- CPU inference is slow on Railway
- May hit memory/disk limits

**Recommendations:**
- Use smallest models possible (`llama3.2:1b` or `phi3-mini`)
- Consider using Railway's GPU instances (if available)
- Or use external Ollama service

## Option 1: Install Ollama in Railway (Recommended for Testing)

### Step 1: Add Build Script

Create a `railway.json` or update your build process to install Ollama.

### Step 2: Set Environment Variables in Railway

Go to Railway Dashboard → Your Service → Variables:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3.2:1b
OLLAMA_VISION_MODEL=llava:7b
```

### Step 3: Add Startup Script

Create `start-with-ollama.sh`:

```bash
#!/bin/bash
# Start Ollama in background
ollama serve &
sleep 5

# Download model (if not already downloaded)
ollama pull llama3.2:1b || echo "Model download failed"

# Start your Node.js app
node index.js
```

### Step 4: Update package.json

```json
{
  "scripts": {
    "start": "bash start-with-ollama.sh"
  }
}
```

## Option 2: Use Railway's Build Process

### Method A: Using Nixpacks

Create `nixpacks.toml` (already created for you):

```toml
[phases.setup]
nixPkgs = ["curl"]

[phases.install]
cmds = [
  "curl -fsSL https://ollama.ai/install.sh | sh"
]

[start]
cmd = "ollama serve & sleep 5 && ollama pull llama3.2:1b && node index.js"
```

### Method B: Using Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Copy app files
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Download model on build (optional - increases build time)
# RUN ollama pull llama3.2:1b

# Start script
CMD ollama serve & sleep 5 && node index.js
```

## Option 3: External Ollama Service (Best for Production)

Instead of running Ollama on Railway, use an external service:

1. **Run Ollama on a separate server** (VPS, dedicated server)
2. **Or use Ollama Cloud** (if available)
3. **Update OLLAMA_BASE_URL** to point to external service

```env
OLLAMA_BASE_URL=https://your-ollama-server.com:11434
```

## Recommended Setup for Railway

### 1. Use Smallest Model

```env
OLLAMA_TEXT_MODEL=llama3.2:1b  # Only 1.1GB
```

### 2. Download Model on First Request

Modify your service to download model lazily:

```javascript
// In ollama-service.cjs
async ensureModelExists() {
  // Check if model exists
  const response = await fetch(`${this.baseUrl}/api/tags`);
  const data = await response.json();
  const hasModel = data.models?.some(m => m.name.includes('llama3.2'));
  
  if (!hasModel) {
    console.log('📥 Downloading model...');
    // Trigger download via API or script
  }
}
```

### 3. Set Resource Limits in Railway

- **Memory**: At least 4GB (8GB recommended)
- **CPU**: As much as possible
- **Disk**: At least 10GB for models

## Quick Setup Steps

### 1. Update Railway Environment Variables

In Railway Dashboard:
```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3.2:1b
```

### 2. Add Build Command (Optional)

In Railway → Settings → Build:
```bash
curl -fsSL https://ollama.ai/install.sh | sh && npm install
```

### 3. Add Start Command

In Railway → Settings → Start:
```bash
ollama serve & sleep 10 && ollama pull llama3.2:1b && node index.js
```

### 4. Deploy and Monitor

1. Push changes to Railway
2. Check deployment logs
3. Monitor memory/CPU usage
4. Test chatbot endpoint

## Troubleshooting

### Problem: Out of Memory

**Solution:**
- Use smaller model (`llama3.2:1b`)
- Increase Railway memory limit
- Or use external Ollama service

### Problem: Build Fails

**Solution:**
- Check Railway logs
- Verify Ollama install script works
- Try Dockerfile approach instead

### Problem: Model Download Fails

**Solution:**
- Download model in startup script
- Or download on first request (lazy loading)
- Check disk space in Railway

### Problem: Too Slow

**Solution:**
- Use smallest model
- Consider Railway GPU instances
- Or use external Ollama service

## Alternative: Keep Using Fallback

If Ollama is too resource-intensive for Railway:

1. **Keep fallback responses** (current behavior)
2. **Or use external AI API** (OpenAI, Anthropic, etc.)
3. **Or run Ollama on separate VPS** and point Railway to it

## Testing

After deployment:

1. Check Railway logs for Ollama initialization
2. Test chatbot endpoint
3. Verify responses are AI-generated (not templates)
4. Monitor resource usage

---

**Note:** Railway free tier may not have enough resources for Ollama. Consider upgrading or using external service.

