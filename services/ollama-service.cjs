// Ollama Service - CPU-based local AI inference
// Uses Ollama server running on localhost:11434

const fetch = globalThis.fetch || require('node-fetch');

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.textModel = process.env.OLLAMA_TEXT_MODEL || 'llama3'; // llama3, phi3-mini, llama3.2:1b, gemma2:2b
    this.visionModel = process.env.OLLAMA_VISION_MODEL || 'llava:7b'; // llava:7b, bakllava:7b
    this.isAvailable = false;
    this.initializeOllama();
  }

  async initializeOllama() {
    try {
      console.log('🔧 Initializing Ollama service...');
      console.log(`📍 Ollama URL: ${this.baseUrl}`);
      console.log(`📝 Text Model: ${this.textModel}`);
      console.log(`👁️  Vision Model: ${this.visionModel}`);
      
      // Test Ollama connection
      const response = await fetch(`${this.baseUrl}/api/tags`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Ollama server is running');
        console.log('📋 Available models:', data.models?.map(m => m.name) || []);
        
        // Check if required models are available
        const availableModelNames = data.models?.map(m => m.name) || [];
        const hasTextModel = availableModelNames.some(name => 
          name.includes(this.textModel.split(':')[0])
        );
        const hasVisionModel = availableModelNames.some(name => 
          name.includes(this.visionModel.split(':')[0])
        );
        
        if (!hasTextModel) {
          console.warn(`⚠️  Text model '${this.textModel}' not found. Run: ollama pull ${this.textModel}`);
        }
        if (!hasVisionModel) {
          console.warn(`⚠️  Vision model '${this.visionModel}' not found. Run: ollama pull ${this.visionModel}`);
        }
        
        this.isAvailable = true;
      } else {
        console.log('❌ Ollama server not responding:', response.status, response.statusText);
        console.log('💡 Make sure Ollama is installed and running. Visit: https://ollama.ai');
      }
    } catch (error) {
      console.log('⚠️  Ollama initialization failed:', error.message);
      console.log('💡 Make sure Ollama is installed and running on', this.baseUrl);
      console.log('💡 Install from: https://ollama.ai');
    }
  }

  async generateResponse(message, context = {}, chatHistory = []) {
    // Try Ollama first if available
    if (this.isAvailable) {
      try {
        console.log('🤖 Using Ollama for response...');
        return await this.generateOllamaResponse(message, context, chatHistory);
      } catch (error) {
        console.log('❌ Ollama failed, falling back to enhanced service:', error.message);
        // Don't set isAvailable to false, might be temporary issue
      }
    }
    
    // Fall back to enhanced service
    console.log('🔄 Using enhanced fallback service...');
    return await this.generateEnhancedResponse(message, context, chatHistory);
  }

  async generateOllamaResponse(message, context = {}, chatHistory = []) {
    try {
      // Build a comprehensive prompt for educational assistance
      let systemPrompt = `You are a Vidya AI for Asli Learn, an educational platform. You help students with their studies across various subjects including Physics, Chemistry, Mathematics, and Biology.

Your role is to:
1. Provide clear, direct answers to questions
2. Give step-by-step solutions to problems
3. Explain concepts in simple terms
4. Be helpful and educational

Guidelines:
- Always give direct answers first, then explanations
- For math problems, show the calculation and result
- Use clear, simple language
- Be encouraging and supportive`;

      // Add context if available
      if (context.currentSubject) {
        systemPrompt += `\n\nCurrent Study Context: The student is studying ${context.currentSubject}`;
        if (context.currentTopic) {
          systemPrompt += `, specifically focusing on ${context.currentTopic}`;
        }
      }

      // Build conversation history
      let conversationHistory = '';
      if (chatHistory.length > 0) {
        conversationHistory = '\n\nPrevious conversation:\n';
        chatHistory.slice(-5).forEach(msg => {
          conversationHistory += `${msg.role === 'user' ? 'Student' : 'Vidya AI'}: ${msg.content}\n`;
        });
      }

      const fullPrompt = `${systemPrompt}${conversationHistory}\n\nStudent: ${message}\n\nVidya AI:`;

      // Call Ollama API - matching your endpoint format
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.textModel,
          prompt: fullPrompt,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.response || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error('Ollama API error:', error);
      throw new Error('Failed to generate Ollama response');
    }
  }

  async generateEnhancedResponse(message, context = {}, chatHistory = []) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Enhanced responses with direct answers
    let response = '';
    
    // Math-related responses with direct solving
    if (message.includes('+') || message.includes('-') || message.includes('*') || message.includes('/') || 
        message.includes('=') || message.includes('math') || message.includes('calculate')) {
      
      const mathResult = this.solveMathProblem(message);
      if (mathResult) {
        response = mathResult;
      } else {
        response = "I can help you with that math problem! Let me solve it step by step:\n\n";
        response += "Please provide the specific numbers and operation you'd like me to solve.";
      }
    }
    // Physics-related responses
    else if (message.toLowerCase().includes('physics') || message.toLowerCase().includes('motion') || 
             message.toLowerCase().includes('force') || message.toLowerCase().includes('energy')) {
      response = "Great physics question! Let me explain this clearly:\n\n";
      response += "In physics, we use scientific principles to understand natural phenomena. ";
      response += "I'll break this down into clear concepts and provide examples to help you understand.";
    }
    // Chemistry-related responses
    else if (message.toLowerCase().includes('chemistry') || message.toLowerCase().includes('molecule') || 
             message.toLowerCase().includes('atom') || message.toLowerCase().includes('reaction')) {
      response = "Excellent chemistry question! Let me explain this:\n\n";
      response += "Chemistry is the study of matter and its transformations. ";
      response += "I'll explain the concepts using clear examples and show you how to apply them.";
    }
    // Biology-related responses
    else if (message.toLowerCase().includes('biology') || message.toLowerCase().includes('cell') || 
             message.toLowerCase().includes('organism') || message.toLowerCase().includes('life')) {
      response = "Fascinating biology question! Let me explain this:\n\n";
      response += "Biology helps us understand living systems and their functions. ";
      response += "I'll break down the processes and show you how different components work together.";
    }
    // General educational responses
    else {
      const responses = [
        "That's an excellent question! Let me help you understand this concept clearly.",
        "I'm here to help you learn! This is an important topic to master.",
        "Great question! Let me break this down into manageable parts.",
        "I can definitely help you with this! Let me explain it step by step.",
        "That's a thoughtful question! This concept is fundamental to your studies."
      ];
      response = responses[Math.floor(Math.random() * responses.length)] + "\n\n";
      response += "Here's how I'll help you understand this:\n";
      response += "1. **Clear Explanation**: I'll explain the concept in simple terms\n";
      response += "2. **Examples**: I'll provide relevant examples\n";
      response += "3. **Step-by-Step**: I'll break it down into manageable parts\n";
      response += "4. **Practice**: I'll suggest ways to practice and apply what you learn\n\n";
    }
    
    // Add subject-specific context
    if (context.currentSubject) {
      response += `Since you're studying **${context.currentSubject}**, I'll focus on that subject area. `;
      response += "This will help you connect this concept to your current studies.\n\n";
    }
    
    // Add study tips
    response += "💡 **Study Tip**: The key to mastering any subject is understanding the underlying principles. ";
    response += "Don't just memorize facts - try to understand the 'why' behind everything you learn. ";
    response += "This will help you apply your knowledge to new situations and solve problems more effectively.";
    
    return response;
  }

  solveMathProblem(message) {
    try {
      // Clean the message and extract math expression
      let expression = message.replace(/[^0-9+\-*/().=]/g, '').trim();
      
      // Handle simple addition like "1+6="
      if (expression.includes('+') && expression.includes('=')) {
        const parts = expression.split('+');
        if (parts.length === 2) {
          const first = parseInt(parts[0].trim());
          const second = parseInt(parts[1].split('=')[0].trim());
          
          if (!isNaN(first) && !isNaN(second)) {
            const result = first + second;
            return `**${first} + ${second} = ${result}**\n\n` +
                   `Here's how to solve it:\n` +
                   `1. Start with the first number: ${first}\n` +
                   `2. Add the second number: ${first} + ${second}\n` +
                   `3. Count forward: ${first}, ${first + 1}, ${first + 2}`;
          }
        }
      }
      
      // Handle simple subtraction
      if (expression.includes('-') && expression.includes('=')) {
        const parts = expression.split('-');
        if (parts.length === 2) {
          const first = parseInt(parts[0].trim());
          const second = parseInt(parts[1].split('=')[0].trim());
          
          if (!isNaN(first) && !isNaN(second)) {
            const result = first - second;
            return `**${first} - ${second} = ${result}**\n\n` +
                   `Here's how to solve it:\n` +
                   `1. Start with the first number: ${first}\n` +
                   `2. Subtract the second number: ${first} - ${second}\n` +
                   `3. Count backward: ${first}, ${first - 1}, ${result}`;
          }
        }
      }
      
      // Handle simple multiplication
      if (expression.includes('*') && expression.includes('=')) {
        const parts = expression.split('*');
        if (parts.length === 2) {
          const first = parseInt(parts[0].trim());
          const second = parseInt(parts[1].split('=')[0].trim());
          
          if (!isNaN(first) && !isNaN(second)) {
            const result = first * second;
            return `**${first} × ${second} = ${result}**\n\n` +
                   `Here's how to solve it:\n` +
                   `1. Start with the first number: ${first}\n` +
                   `2. Multiply by the second number: ${first} × ${second}\n` +
                   `3. Add ${first} to itself ${second} times: ${first} + ${first} + ... = ${result}`;
          }
        }
      }
      
      return null; // Couldn't solve
    } catch (error) {
      return null;
    }
  }

  async analyzeImage(imageBase64, context = '') {
    // Try Ollama vision model first if available
    if (this.isAvailable) {
      try {
        return await this.analyzeImageWithOllama(imageBase64, context);
      } catch (error) {
        console.log('Ollama image analysis failed, falling back to mock:', error.message);
      }
    }
    
    // Fall back to mock image analysis
    return await this.analyzeImageMock(imageBase64, context);
  }

  async analyzeImageWithOllama(imageBase64, context = '') {
    try {
      const prompt = `You are a Vidya AI. Analyze this image and provide educational assistance. 
      ${context ? `Context: ${context}` : ''}
      
      Please:
      1. Identify what's in the image (math problem, diagram, text, etc.)
      2. Provide step-by-step explanation or solution
      3. Give educational insights about the content
      4. Suggest related concepts to study`;

      // Ollama vision models expect base64 images
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.visionModel,
          prompt: prompt,
          images: [imageBase64], // Ollama accepts base64 images directly
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.response || 'I could not analyze this image.';
    } catch (error) {
      console.error('Ollama vision API error:', error);
      throw new Error('Failed to analyze image with Ollama');
    }
  }

  async analyzeImageMock(imageBase64, context = '') {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    let response = "I can see this image contains educational content. ";
    
    if (context) {
      response += `Given the context of ${context}, `;
    }
    
    response += "I can help you understand the concepts shown. ";
    response += "The image appears to contain mathematical or scientific content that I can help you work through step by step. ";
    response += "Would you like me to explain any specific part of what you see?";
    
    return response;
  }

  // Helper method to generate structured content (for test questions, lesson plans, etc.)
  async generateStructuredContent(prompt, format = 'text') {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available');
    }

    try {
      const systemPrompt = format === 'json' 
        ? 'You are a helpful assistant. Respond ONLY with valid JSON, no markdown, no code blocks, just pure JSON.'
        : 'You are a helpful assistant. Provide clear, structured responses.';

      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.textModel,
          prompt: fullPrompt,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      let result = data.response || '';

      // Clean JSON if format is json
      if (format === 'json') {
        result = result.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      }

      return result;
    } catch (error) {
      console.error('Ollama structured content error:', error);
      throw new Error('Failed to generate structured content');
    }
  }
}

const ollamaService = new OllamaService();

module.exports = { ollamaService };

