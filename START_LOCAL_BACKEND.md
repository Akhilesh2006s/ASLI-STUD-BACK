# Starting Local Backend

## Quick Start

### Step 1: Make Sure Ollama is Running

Check if Ollama is running:
```powershell
curl http://localhost:11434/api/tags
```

If not running, start Ollama:
- Search "Ollama" in Start menu and open it
- Or run: `ollama serve` (keep window open)

### Step 2: Navigate to Backend Folder

```powershell
cd C:\Users\kaash\Desktop\Asli\ASLI-STUD-BACK
```

### Step 3: Install Dependencies (if needed)

```powershell
npm install
```

### Step 4: Configure Environment (Optional)

Make sure your `.env` file has:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

### Step 5: Start the Backend

**For production:**
```powershell
npm start
```

**For development (with auto-reload):**
```powershell
npm run dev
```

### Step 6: Verify It's Running

You should see:
```
Server running on port 5000
🔧 Initializing Ollama service...
✅ Ollama server is running
📋 Available models: [...]
```

## Backend Endpoints

- **API Base**: `http://localhost:5000`
- **Ollama**: `http://localhost:11434`
- **Chat Endpoint**: `http://localhost:5000/api/ai-chat`
- **Image Analysis**: `http://localhost:5000/api/ai-analyze-image`

## Troubleshooting

### Port Already in Use

If port 5000 is busy:
1. Change PORT in `.env`: `PORT=5001`
2. Or kill the process using port 5000

### Ollama Not Found

Make sure:
1. Ollama is installed
2. Ollama is running
3. Model is downloaded: `ollama pull llama3`

### MongoDB Connection Error

Check your `MONGO_URI` in `.env` file

## Testing

Test the backend:
```powershell
curl http://localhost:5000/api/health
```

Or test chat:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/ai-chat" -Method Post -ContentType "application/json" -Body '{"userId":"test","message":"Hello"}'
```

