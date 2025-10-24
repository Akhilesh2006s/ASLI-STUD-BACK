class ChatGPTLikeService {
  constructor() {
    this.responses = {
      math: {
        patterns: [
          /(\d+)\s*\+\s*(\d+)\s*[=]?/,
          /(\d+)\s*-\s*(\d+)\s*[=]?/,
          /(\d+)\s*\*\s*(\d+)\s*[=]?/,
          /(\d+)\s*\/\s*(\d+)\s*[=]?/,
          /what\s+is\s+(\d+)\s*\+\s*(\d+)/i,
          /solve\s+(\d+)\s*\+\s*(\d+)/i
        ],
        solve: (a, b, op) => {
          switch(op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return Math.floor(a / b);
            default: return a + b;
          }
        }
      },
      physics: {
        topics: ['newton', 'motion', 'force', 'energy', 'velocity', 'acceleration', 'gravity'],
        responses: [
          "Newton's first law states that an object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force.",
          "Force equals mass times acceleration (F = ma). This is Newton's second law of motion.",
          "Energy cannot be created or destroyed, only transferred or converted from one form to another.",
          "Gravity is a fundamental force that attracts objects with mass toward each other."
        ]
      },
      chemistry: {
        topics: ['photosynthesis', 'molecule', 'atom', 'reaction', 'compound', 'element'],
        responses: [
          "Photosynthesis is the process by which plants convert light energy into chemical energy, producing glucose and oxygen.",
          "A molecule is the smallest unit of a compound that retains the chemical properties of that compound.",
          "An atom is the basic unit of matter, consisting of a nucleus (protons and neutrons) and electrons.",
          "A chemical reaction occurs when atoms are rearranged to form new substances."
        ]
      },
      biology: {
        topics: ['cell', 'organism', 'dna', 'evolution', 'ecosystem', 'photosynthesis'],
        responses: [
          "A cell is the basic structural and functional unit of all living organisms.",
          "DNA (Deoxyribonucleic acid) contains the genetic instructions for the development and function of living things.",
          "Evolution is the process by which species change over time through natural selection.",
          "An ecosystem is a community of living organisms interacting with their physical environment."
        ]
      }
    };
  }

  async generateResponse(message, context = {}, chatHistory = []) {
    // Simulate realistic response time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const lowerMessage = message.toLowerCase();
    
    // Try to solve math problems first
    const mathResult = this.solveMathProblem(message);
    if (mathResult) {
      return mathResult;
    }
    
    // Check for specific topics and provide detailed responses
    if (this.containsTopic(lowerMessage, this.responses.physics.topics)) {
      return this.generatePhysicsResponse(message);
    }
    
    if (this.containsTopic(lowerMessage, this.responses.chemistry.topics)) {
      return this.generateChemistryResponse(message);
    }
    
    if (this.containsTopic(lowerMessage, this.responses.biology.topics)) {
      return this.generateBiologyResponse(message);
    }
    
    // General educational response
    return this.generateGeneralResponse(message, context);
  }

  solveMathProblem(message) {
    const math = this.responses.math;
    
    for (const pattern of math.patterns) {
      const match = message.match(pattern);
      if (match) {
        const a = parseInt(match[1]);
        const b = parseInt(match[2]);
        
        if (!isNaN(a) && !isNaN(b)) {
          const result = a + b; // Default to addition
          return `**${a} + ${b} = ${result}**\n\n` +
                 `Here's the solution:\n` +
                 `1. Start with ${a}\n` +
                 `2. Add ${b} to it\n` +
                 `3. ${a} + ${b} = ${result}\n\n` +
                 `💡 **Tip**: You can verify this by counting: ${a}, ${a + 1}, ${a + 2}, ..., ${result}`;
        }
      }
    }
    
    return null;
  }

  containsTopic(message, topics) {
    return topics.some(topic => message.includes(topic));
  }

  generatePhysicsResponse(message) {
    const responses = this.responses.physics.responses;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return `**Physics Explanation:**\n\n${randomResponse}\n\n` +
           `Let me break this down further:\n` +
           `- This is a fundamental concept in physics\n` +
           `- Understanding this will help you with more advanced topics\n` +
           `- Try to visualize the concept with examples\n\n` +
           `💡 **Study Tip**: Physics is about understanding the "why" behind natural phenomena. ` +
           `Always try to connect concepts to real-world examples.`;
  }

  generateChemistryResponse(message) {
    const responses = this.responses.chemistry.responses;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return `**Chemistry Explanation:**\n\n${randomResponse}\n\n` +
           `Here's how to understand this concept:\n` +
           `- Think about the molecular level\n` +
           `- Consider how atoms interact\n` +
           `- Look for patterns in chemical behavior\n\n` +
           `💡 **Study Tip**: Chemistry is about understanding matter and its transformations. ` +
           `Always think about what's happening at the atomic level.`;
  }

  generateBiologyResponse(message) {
    const responses = this.responses.biology.responses;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return `**Biology Explanation:**\n\n${randomResponse}\n\n` +
           `Key points to remember:\n` +
           `- This is essential for understanding life processes\n` +
           `- Look for connections between different biological systems\n` +
           `- Consider how this relates to evolution and adaptation\n\n` +
           `💡 **Study Tip**: Biology is about understanding life at all levels. ` +
           `Always think about how different systems work together.`;
  }

  generateGeneralResponse(message, context) {
    const responses = [
      "That's an excellent question! Let me help you understand this concept clearly.",
      "I'm here to help you learn! This is an important topic to master.",
      "Great question! Let me break this down into manageable parts.",
      "I can definitely help you with this! Let me explain it step by step.",
      "That's a thoughtful question! This concept is fundamental to your studies."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    let response = `**${randomResponse}**\n\n`;
    
    response += `Here's how I'll help you understand this:\n`;
    response += `1. **Clear Explanation**: I'll explain the concept in simple terms\n`;
    response += `2. **Examples**: I'll provide relevant examples\n`;
    response += `3. **Step-by-Step**: I'll break it down into manageable parts\n`;
    response += `4. **Practice**: I'll suggest ways to practice and apply what you learn\n\n`;
    
    if (context.currentSubject) {
      response += `Since you're studying **${context.currentSubject}**, I'll focus on that subject area. `;
      response += `This will help you connect this concept to your current studies.\n\n`;
    }
    
    response += `💡 **Study Tip**: The key to mastering any subject is understanding the underlying principles. ` +
               `Don't just memorize facts - try to understand the "why" behind everything you learn. ` +
               `This will help you apply your knowledge to new situations and solve problems more effectively.`;
    
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

const chatGPTLikeService = new ChatGPTLikeService();

module.exports = { chatGPTLikeService };
