// Ollama Service - CPU-based local AI inference (ES Module version)
// Uses Ollama server running on localhost:11434

const fetch = globalThis.fetch;

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.textModel = process.env.OLLAMA_TEXT_MODEL || 'llama3'; // llama3, phi3-mini, llama3.2:1b, gemma2:2b
    this.visionModel = process.env.OLLAMA_VISION_MODEL || 'llava:7b'; // llava:7b, bakllava:7b
  }

  async generateStructuredContent(prompt, format = 'text') {
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
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }
}

const ollamaService = new OllamaService();

export const generateLessonPlan = async (subject, topic, gradeLevel, duration) => {
  try {
    const prompt = `
    Create a comprehensive lesson plan for:
    - Subject: ${subject}
    - Topic: ${topic}
    - Grade Level: ${gradeLevel}
    - Duration: ${duration} minutes
    
    Please provide:
    1. Learning Objectives (3-5 specific goals)
    2. Materials Needed
    3. Introduction (5-10 minutes)
    4. Main Activities (with time allocations)
    5. Assessment/Evaluation
    6. Homework/Follow-up
    7. Differentiation strategies
    
    Format the response in a clear, structured manner suitable for a teacher to follow.
    `;

    return await ollamaService.generateStructuredContent(prompt, 'text');
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    throw new Error('Failed to generate lesson plan');
  }
};

export const generateTestQuestions = async (subject, topic, gradeLevel, questionCount, difficulty) => {
  try {
    console.log('Initializing Ollama model for test questions...');
    
    const prompt = `Generate exactly ${questionCount} multiple-choice test questions for:
- Subject: ${subject}
- Topic: ${topic}
- Grade Level: ${gradeLevel}
- Difficulty: ${difficulty}

IMPORTANT: You MUST return ONLY valid JSON in the following exact format (no markdown, no code blocks, just pure JSON):
{
  "questions": [
    {
      "question": "Question text here",
      "type": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation of why the correct answer is right"
    }
  ]
}

Requirements:
1. Generate exactly ${questionCount} questions
2. All questions must be multiple-choice with exactly 4 options (A, B, C, D)
3. Each question must have exactly ONE correct answer
4. Questions should be appropriate for ${gradeLevel} level
5. Difficulty should match: ${difficulty}
6. Questions should cover the topic: ${topic} in ${subject}
7. Include clear explanations for each correct answer
8. Return ONLY the JSON object, no additional text before or after`;

    console.log('Trying Ollama with model:', ollamaService.textModel);
    const result = await ollamaService.generateStructuredContent(prompt, 'json');
    
    console.log('✅ Successfully generated with Ollama');
    console.log('Ollama response received, length:', result.length);
    console.log('Response preview:', result.substring(0, 200));
    
    return result;
  } catch (error) {
    console.error('Error generating test questions:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more specific error messages
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      throw new Error('Ollama server is not running. Please install and start Ollama. Visit: https://ollama.ai');
    } else if (error.message?.includes('model')) {
      throw new Error(`Ollama model not found. Please run: ollama pull ${ollamaService.textModel}`);
    } else {
      throw new Error(`Failed to generate test questions: ${error.message || 'Unknown error'}`);
    }
  }
};

export const generateClasswork = async (subject, topic, gradeLevel, assignmentType) => {
  try {
    const prompt = `
    Create ${assignmentType} for:
    - Subject: ${subject}
    - Topic: ${topic}
    - Grade Level: ${gradeLevel}
    
    Please provide:
    1. Assignment Title
    2. Instructions (clear and detailed)
    3. Tasks/Questions
    4. Rubric/Evaluation Criteria
    5. Expected Time to Complete
    6. Resources/References
    
    Make the assignment engaging and appropriate for the grade level.
    Include both individual and group work elements if applicable.
    `;

    return await ollamaService.generateStructuredContent(prompt, 'text');
  } catch (error) {
    console.error('Error generating classwork:', error);
    throw new Error('Failed to generate classwork');
  }
};

export const generateSchedule = async (subjects, gradeLevels, timeSlots, preferences) => {
  try {
    const prompt = `
    Create a teaching schedule for:
    - Subjects: ${subjects.join(', ')}
    - Grade Levels: ${gradeLevels.join(', ')}
    - Available Time Slots: ${timeSlots.join(', ')}
    - Preferences: ${preferences}
    
    Please provide:
    1. Weekly Schedule (Monday to Friday)
    2. Subject Distribution
    3. Break Times
    4. Preparation Time
    5. Assessment Schedule
    6. Professional Development Time
    
    Ensure the schedule is balanced and follows best practices for teaching.
    `;

    return await ollamaService.generateStructuredContent(prompt, 'text');
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw new Error('Failed to generate schedule');
  }
};

