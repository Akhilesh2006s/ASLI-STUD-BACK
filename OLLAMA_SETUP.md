# Ollama Setup Guide for CPU-Based Local AI

This guide explains how to set up Ollama for running AI models locally on CPU without external APIs or GPU.

## What is Ollama?

Ollama is a tool that runs large language models locally on your machine. It handles model management, quantization, and CPU optimization automatically.

## Installation

### Windows

1. Download Ollama from: https://ollama.ai/download
2. Run the installer
3. Ollama will start automatically as a service

### macOS

```bash
# Using Homebrew
brew install ollama

# Or download from: https://ollama.ai/download
```

### Linux

```bash
# Install using the official script
curl -fsSL https://ollama.ai/install.sh | sh

# Or download from: https://ollama.ai/download
```

## Verify Installation

After installation, verify Ollama is running:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Or visit in browser: http://localhost:11434/api/tags
```

You should see a JSON response with available models (initially empty).

## Download Required Models

The application uses two types of models:

### 1. Text Generation Models (for chat, analysis, questions)

**Recommended (choose one):**

```bash
# Option 1: phi3-mini (2.3GB) - Best balance of quality and speed
ollama pull phi3-mini

# Option 2: llama3.2:1b (1.1GB) - Fastest, smaller size
ollama pull llama3.2:1b

# Option 3: gemma2:2b (1.4GB) - Good alternative
ollama pull gemma2:2b

# Option 4: qwen2.5:1.5b (1GB) - Very small, decent quality
ollama pull qwen2.5:1.5b
```

**For better quality (if you have more RAM):**

```bash
# llama3.2:3b (2GB) - Better for structured outputs
ollama pull llama3.2:3b
```

### 2. Vision Models (for image analysis)

```bash
# llava:7b (4GB) - Vision-language model for image analysis
ollama pull llava:7b

# Alternative: bakllava:7b (4GB)
ollama pull bakllava:7b
```

## Configuration

### Environment Variables

You can configure the models used by setting environment variables:

```bash
# In your .env file or environment
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=phi3-mini
OLLAMA_VISION_MODEL=llava:7b
```

### Default Configuration

If not set, the application uses:
- **Text Model**: `phi3-mini`
- **Vision Model**: `llava:7b`
- **Base URL**: `http://localhost:11434`

## Model Recommendations by Use Case

### For Chat/Conversation
- **Best**: `phi3-mini` (2.3GB)
- **Fastest**: `llama3.2:1b` (1.1GB)
- **Smallest**: `qwen2.5:1.5b` (1GB)

### For Structured Outputs (JSON, test questions)
- **Best**: `llama3.2:3b` (2GB)
- **Alternative**: `phi3-mini` (2.3GB)

### For Image Analysis
- **Best**: `llava:7b` (4GB)
- **Alternative**: `bakllava:7b` (4GB)

## System Requirements

### Minimum Requirements
- **RAM**: 4GB (for 1B models)
- **CPU**: Any modern multi-core CPU
- **Disk Space**: 5-10GB (for models)

### Recommended Requirements
- **RAM**: 8GB+ (for 3B models or image analysis)
- **CPU**: Multi-core processor (4+ cores)
- **Disk Space**: 10-15GB (for multiple models)

## Testing the Setup

1. **Test Ollama connection:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Test a model:**
   ```bash
   ollama run phi3-mini "Hello, how are you?"
   ```

3. **Test the application:**
   - Start your backend server
   - Check console logs for Ollama initialization messages
   - Try using the AI chat feature

## Troubleshooting

### Ollama not starting

**Windows:**
- Check if Ollama service is running in Task Manager
- Restart the service: `net stop ollama` then `net start ollama`

**macOS/Linux:**
```bash
# Start Ollama manually
ollama serve
```

### Model not found

If you see "model not found" errors:
1. List available models: `ollama list`
2. Pull the required model: `ollama pull <model-name>`
3. Check the model name matches your environment variables

### Connection refused

If you see "ECONNREFUSED" errors:
1. Verify Ollama is running: `curl http://localhost:11434/api/tags`
2. Check if port 11434 is available
3. Verify OLLAMA_BASE_URL environment variable

### Slow responses

- Use smaller models (1B-2B instead of 7B)
- Reduce `num_predict` in model options
- Ensure you have enough RAM
- Close other applications to free up resources

### Out of memory

- Use smaller models
- Reduce batch size
- Close other applications
- Consider upgrading RAM

## Model Management

### List installed models
```bash
ollama list
```

### Remove a model
```bash
ollama rm <model-name>
```

### Show model information
```bash
ollama show <model-name>
```

## Production Deployment

### Docker Deployment

If deploying with Docker, include Ollama in your container:

```dockerfile
# Example Dockerfile addition
FROM ollama/ollama:latest as ollama
# ... your app setup
```

Or run Ollama as a separate service and connect via network.

### Railway/Cloud Deployment

For cloud deployments:
1. Install Ollama in your deployment environment
2. Pre-download models during build
3. Ensure sufficient RAM allocation (8GB+ recommended)
4. Set environment variables for model configuration

## Performance Tips

1. **Use quantized models**: Ollama automatically uses quantized models (smaller, faster)
2. **Cache responses**: Implement response caching for common queries
3. **Batch requests**: Group multiple requests when possible
4. **Stream responses**: Use streaming for better perceived performance
5. **Monitor resources**: Watch CPU and RAM usage

## Security Notes

- Ollama runs locally, so your data never leaves your machine
- No API keys required
- No external service dependencies
- All processing happens on your server

## Next Steps

1. Install Ollama
2. Download recommended models
3. Start your backend server
4. Test AI features
5. Monitor performance and adjust models as needed

## Support

- Ollama Documentation: https://ollama.ai/docs
- Ollama GitHub: https://github.com/ollama/ollama
- Model Library: https://ollama.ai/library

## Migration from Gemini API

The application has been updated to use Ollama instead of Gemini API. The interface remains the same, so no frontend changes are needed. Simply:

1. Install Ollama
2. Download models
3. Restart your backend server

The application will automatically use Ollama if available, or fall back to enhanced mock responses if Ollama is not running.

