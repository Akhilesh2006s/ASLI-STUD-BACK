# Ollama Quick Start Guide

## Quick Setup (5 minutes)

### 1. Install Ollama
- **Windows/Mac**: Download from https://ollama.ai/download
- **Linux**: `curl -fsSL https://ollama.ai/install.sh | sh`

### 2. Download Models
```bash
# Text model (for chat, questions, analysis)
ollama pull phi3-mini

# Vision model (for image analysis) - optional
ollama pull llava:7b
```

### 3. Verify Installation
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags
```

### 4. Start Your Backend
```bash
npm start
```

That's it! Your app now uses local CPU-based AI instead of external APIs.

## Model Size Reference

| Model | Size | Use Case | Speed |
|-------|------|----------|-------|
| `qwen2.5:1.5b` | 1GB | Chat (fastest) | ⚡⚡⚡ |
| `llama3.2:1b` | 1.1GB | Chat (fast) | ⚡⚡⚡ |
| `gemma2:2b` | 1.4GB | Chat (balanced) | ⚡⚡ |
| `phi3-mini` | 2.3GB | Chat (recommended) | ⚡⚡ |
| `llama3.2:3b` | 2GB | Structured outputs | ⚡ |
| `llava:7b` | 4GB | Image analysis | ⚡ |

## Environment Variables (Optional)

Add to `.env`:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=phi3-mini
OLLAMA_VISION_MODEL=llava:7b
```

## Troubleshooting

**Problem**: "Ollama server not responding"
- **Solution**: Make sure Ollama is installed and running
- **Check**: `curl http://localhost:11434/api/tags`

**Problem**: "Model not found"
- **Solution**: Run `ollama pull <model-name>`
- **Check**: `ollama list` to see installed models

**Problem**: Slow responses
- **Solution**: Use smaller models (1B-2B instead of 7B)
- **Check**: Ensure you have enough RAM (4GB+ recommended)

## What Changed?

✅ **No more external API calls** - Everything runs locally
✅ **No API keys needed** - No authentication required
✅ **Works offline** - No internet needed after setup
✅ **Privacy** - Your data never leaves your server
✅ **No rate limits** - Use as much as you want

## Need Help?

See `OLLAMA_SETUP.md` for detailed documentation.

