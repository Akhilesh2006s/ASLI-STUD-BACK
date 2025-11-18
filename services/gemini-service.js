import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable or fallback to the same key used in other services
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDExDEuif6KRk5suciCPLr1sDqkQFDfNb8');

export const generateLessonPlan = async (subject, topic, gradeLevel, duration) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    throw new Error('Failed to generate lesson plan');
  }
};

export const generateTestQuestions = async (subject, topic, gradeLevel, questionCount, difficulty) => {
  try {
    // Use environment variable or fallback key
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDExDEuif6KRk5suciCPLr1sDqkQFDfNb8';
    console.log('Using Gemini API key (length:', apiKey.length, ')');

    console.log('Initializing Gemini model for test questions...');
    
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

    // Try REST API first (more reliable) - using gemini-2.5-flash which works in other services
    try {
      console.log('Trying REST API with gemini-2.5-flash...');
      const restResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      );

      if (!restResponse.ok) {
        throw new Error(`REST API failed: ${restResponse.status} ${restResponse.statusText}`);
      }

      const restData = await restResponse.json();
      let text = restData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        // Clean up markdown code blocks if present
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        
        console.log('✅ Successfully generated with REST API (gemini-2.5-flash)');
        console.log('Gemini response received, length:', text.length);
        console.log('Response preview:', text.substring(0, 200));
        return text;
      } else {
        throw new Error('No text in REST API response');
      }
    } catch (restErr) {
      console.log(`❌ REST API failed: ${restErr.message}, trying SDK models...`);
    }

    // Fallback to SDK with multiple model names
    const modelNames = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.0-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        console.log(`Trying SDK with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        console.log('Generating test questions with Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up markdown code blocks if present
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        
        console.log(`✅ Successfully generated with ${modelName}`);
        console.log('Gemini response received, length:', text.length);
        console.log('Response preview:', text.substring(0, 200));
        
        return text;
      } catch (err) {
        console.log(`❌ Model ${modelName} failed: ${err.message}`);
        lastError = err;
        // If it's an API key error, don't try other models
        if (err.message?.includes('API_KEY') || err.message?.includes('401') || err.message?.includes('403')) {
          throw new Error(`Invalid or missing Gemini API key: ${err.message}`);
        }
        // Continue to next model
        continue;
      }
    }

    // If all methods failed
    throw new Error(`All Gemini methods failed. Last error: ${lastError?.message || 'Unknown error'}`);
  } catch (error) {
    console.error('Error generating test questions:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      status: error.status
    });
    
    // Provide more specific error messages
    if (error.message?.includes('API_KEY') || error.message?.includes('401') || error.message?.includes('403')) {
      throw new Error('Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.');
    } else if (error.message?.includes('404') || error.message?.includes('model')) {
      throw new Error('Gemini model not found. Please check if the model name is correct.');
    } else if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please try again later.');
    } else {
      throw new Error(`Failed to generate test questions: ${error.message || 'Unknown error'}`);
    }
  }
};

export const generateClasswork = async (subject, topic, gradeLevel, assignmentType) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating classwork:', error);
    throw new Error('Failed to generate classwork');
  }
};

export const generateSchedule = async (subjects, gradeLevels, timeSlots, preferences) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw new Error('Failed to generate schedule');
  }
};
