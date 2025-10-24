const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDExDEuif6KRk5suciCPLr1sDqkQFDfNb8');

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateResponse(message, context = {}, chatHistory = []) {
    try {
      // Build context-aware prompt
      let systemPrompt = `You are an AI tutor for CogniLearn, an educational platform. You help students with their studies across various subjects including Physics, Chemistry, Mathematics, and Biology.

Your role is to:
1. Provide clear, educational explanations
2. Break down complex concepts into understandable parts
3. Give step-by-step solutions to problems
4. Encourage learning and provide study tips
5. Be supportive and patient with students

Guidelines:
- Always explain concepts clearly with examples
- Use appropriate academic language but keep it accessible
- Provide step-by-step solutions for math and science problems
- Encourage students to understand the reasoning behind solutions
- If you don't know something, admit it and suggest resources`;

      // Add context if available
      if (context?.currentSubject) {
        systemPrompt += `\n\nCurrent Study Context: The student is currently studying ${context.currentSubject}`;
        if (context.currentTopic) {
          systemPrompt += `, specifically focusing on ${context.currentTopic}`;
        }
      }

      // Build conversation history
      let conversationHistory = '';
      if (chatHistory.length > 0) {
        conversationHistory = '\n\nPrevious conversation:\n';
        chatHistory.slice(-10).forEach(msg => { // Keep last 10 messages for context
          conversationHistory += `${msg.role === 'user' ? 'Student' : 'AI Tutor'}: ${msg.content}\n`;
        });
      }

      const fullPrompt = `${systemPrompt}${conversationHistory}\n\nStudent: ${message}\n\nAI Tutor:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async analyzeImage(imageBase64, context = '') {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are an AI tutor. Analyze this image and provide educational assistance. 
      ${context ? `Context: ${context}` : ''}
      
      Please:
      1. Identify what's in the image (math problem, diagram, text, etc.)
      2. Provide step-by-step explanation or solution
      3. Give educational insights about the content
      4. Suggest related concepts to study`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini Vision API error:', error);
      throw new Error('Failed to analyze image');
    }
  }
}

const geminiService = new GeminiService();

module.exports = { geminiService };
