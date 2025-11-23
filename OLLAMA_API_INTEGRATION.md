# Ollama API Integration

## Updated Integration

The Ollama service has been updated to match your API endpoint format:

```javascript
const response = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama3",
    prompt: "Your prompt here",
    stream: false
  })
});

const data = await response.json();
return data.response;
```

## Default Model

The default model is now set to **`llama3`** (matching your example).

You can change it by setting environment variables in `.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3
OLLAMA_VISION_MODEL=llava:7b
```

## API Endpoint

All services now use:
- **Endpoint**: `http://localhost:11434/api/generate`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**: `{ model, prompt, stream: false }`

## Response Format

The service expects:
```json
{
  "response": "Generated text here",
  "done": true,
  ...
}
```

And extracts: `data.response`

## Updated Files

1. ✅ `services/ollama-service.cjs` - Updated to use `llama3` and simplified API format
2. ✅ `services/ollama-service.js` - Updated to use `llama3` and simplified API format
3. ✅ `services/ai-service.js` - Updated to use `llama3` and simplified API format

## Next Steps

1. **Download llama3 model:**
   ```bash
   ollama pull llama3
   ```

2. **Test the integration:**
   ```bash
   ollama run llama3 "Hello!"
   ```

3. **Start your backend:**
   ```bash
   npm start
   ```

4. **Verify in console:**
   - You should see: `📝 Text Model: llama3`
   - You should see: `✅ Ollama server is running`

## Model Options

You can use any Ollama model by setting `OLLAMA_TEXT_MODEL`:

- `llama3` (default) - Good balance
- `llama3.2:1b` - Faster, smaller
- `phi3-mini` - Alternative option
- `gemma2:2b` - Another option

## Testing

Test the API directly:

```bash
curl http://localhost:11434/api/generate -d "{\"model\":\"llama3\",\"prompt\":\"hello\",\"stream\":false}"
```

Or using PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -ContentType "application/json" -Body '{"model":"llama3","prompt":"hello","stream":false}'
```

---

**Integration complete!** The service now matches your API endpoint format exactly.

