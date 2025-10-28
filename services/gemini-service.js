import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key');

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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Generate ${questionCount} test questions for:
    - Subject: ${subject}
    - Topic: ${topic}
    - Grade Level: ${gradeLevel}
    - Difficulty: ${difficulty}
    
    Please provide questions in the following format:
    {
      "questions": [
        {
          "question": "Question text here",
          "type": "multiple-choice",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A",
          "explanation": "Explanation of the correct answer"
        }
      ]
    }
    
    Include a mix of question types: multiple-choice, true/false, short answer, and essay questions.
    Make sure the questions are appropriate for the grade level and difficulty specified.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating test questions:', error);
    throw new Error('Failed to generate test questions');
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
