#!/bin/bash
# Railway startup script with Ollama

echo "🚀 Starting Railway backend with Ollama..."

# Start Ollama in background
echo "📦 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
sleep 10

# Check if Ollama is running
if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "✅ Ollama is running"
  
  # Download model if not exists
  echo "📥 Checking for model..."
  MODEL_EXISTS=$(curl -s http://localhost:11434/api/tags | grep -o "llama3.2:1b" || echo "")
  
  if [ -z "$MODEL_EXISTS" ]; then
    echo "📥 Downloading llama3.2:1b model..."
    ollama pull llama3.2:1b || echo "⚠️ Model download failed, will use fallback"
  else
    echo "✅ Model already exists"
  fi
else
  echo "⚠️ Ollama failed to start, will use fallback responses"
fi

# Start Node.js application
echo "🚀 Starting Node.js application..."
exec node index.js

