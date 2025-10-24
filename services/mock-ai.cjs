class MockAIService {
  constructor() {
    this.responses = [
      "I'd be happy to help you with that! Let me break this down step by step.",
      "That's a great question! Here's how I would approach this problem:",
      "I understand you're looking for help with this concept. Let me explain it clearly:",
      "This is an interesting topic! Let me provide you with a detailed explanation:",
      "I can definitely help you understand this better. Here's what you need to know:",
      "That's a common question students ask. Let me walk you through the solution:",
      "I'm here to help you learn! Let me explain this concept in a way that's easy to understand:",
      "That's a challenging topic, but I'll make it clear for you. Here's the breakdown:"
    ];
  }

  async generateResponse(message, context = {}, chatHistory = []) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate a contextual response
    let response = this.responses[Math.floor(Math.random() * this.responses.length)];
    
    // Add subject-specific context
    if (context.currentSubject) {
      response += `\n\nSince you're studying ${context.currentSubject}, I'll focus on that subject area. `;
    }
    
    // Add some educational content based on the message
    if (message.toLowerCase().includes('physics') || message.toLowerCase().includes('motion')) {
      response += "\n\nIn physics, we often use equations like F = ma (Newton's second law) to solve problems. The key is to identify what you know and what you need to find.";
    } else if (message.toLowerCase().includes('chemistry') || message.toLowerCase().includes('molecule')) {
      response += "\n\nIn chemistry, understanding molecular structure and bonding is crucial. Remember to balance chemical equations and consider electron configurations.";
    } else if (message.toLowerCase().includes('math') || message.toLowerCase().includes('equation')) {
      response += "\n\nFor mathematics problems, start by identifying the given information and what you need to solve for. Show your work step by step.";
    } else if (message.toLowerCase().includes('biology') || message.toLowerCase().includes('cell')) {
      response += "\n\nIn biology, understanding cellular processes and systems is fundamental. Focus on how different components work together.";
    }
    
    // Add some study tips
    response += "\n\n💡 Study Tip: Try to understand the underlying concepts rather than just memorizing formulas. This will help you apply your knowledge to new problems.";
    
    return response;
  }

  async analyzeImage(imageBase64, context = '') {
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
}

const mockAIService = new MockAIService();

export { mockAIService };
