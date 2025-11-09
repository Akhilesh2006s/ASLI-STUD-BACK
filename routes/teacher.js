import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import {
  verifyToken,
  verifyTeacher,
  extractTeacherId
} from '../middleware/auth.js';
import {
  getTeacherDashboardStats,
  testTeacherData
} from '../controllers/adminController.js';
import {
  createLessonPlan,
  createTestQuestions,
  createClasswork,
  createSchedule
} from '../controllers/aiToolsController.js';
import Video from '../models/Video.js';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
import ExamResult from '../models/ExamResult.js';
import Teacher from '../models/Teacher.js';
import Content from '../models/Content.js';

const router = express.Router();

// Test route without any middleware
router.post('/test-video', async (req, res) => {
  try {
    console.log('=== SIMPLE TEST VIDEO ===');
    console.log('Body:', req.body);
    
    const testVideo = new Video({
      title: 'Simple Test',
      description: 'Test',
      subjectId: 'test',
      duration: 3600,
      videoUrl: 'https://test.com',
      youtubeUrl: 'https://test.com',
      isYouTubeVideo: true,
      difficulty: 'beginner',
      createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      adminId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      isPublished: true
    });
    
    await testVideo.save();
    res.json({ success: true, message: 'Simple test passed', id: testVideo._id });
  } catch (error) {
    console.error('Simple test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(verifyTeacher);
router.use(extractTeacherId);

// Teacher Dashboard Routes
router.get('/dashboard', getTeacherDashboardStats);
router.get('/test', testTeacherData);

// AI Tools Routes
router.post('/ai/lesson-plan', createLessonPlan);
router.post('/ai/test-questions', createTestQuestions);
router.post('/ai/classwork', createClasswork);
router.post('/ai/schedule', createSchedule);

// Grading endpoint
router.post('/grade-work', upload.single('file'), async (req, res) => {
  try {
    const { rubric, studentWork } = req.body;
    const file = req.file;
    
    if (!studentWork && !file) {
      return res.status(400).json({ success: false, message: 'Student work or file is required' });
    }

    // Import Gemini service
    const { restGeminiService } = await import('../services/rest-gemini.cjs');
    
    // Extract text from file if uploaded
    let workText = studentWork || '';
    if (file) {
      // For text files, use the buffer directly
      if (file.mimetype.startsWith('text/') || file.originalname.endsWith('.txt')) {
        workText = file.buffer.toString('utf-8');
      } else if (file.mimetype === 'application/pdf') {
        // For PDFs, we'll need to extract text (simplified - in production use pdf-parse or similar)
        workText = '[PDF file uploaded - content extraction would be implemented here]';
      } else if (file.mimetype.startsWith('image/')) {
        // For images, convert to base64 and use Gemini vision
        const imageBase64 = file.buffer.toString('base64');
        const imageMimeType = file.mimetype;
        
        // Use Gemini to extract text from image
        const prompt = `Extract all text from this image. If this is student work (essay, assignment, answer), provide the complete text content.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY || 'AIzaSyDExDEuif6KRk5suciCPLr1sDqkQFDfNb8'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: imageBase64,
                    mimeType: imageMimeType
                  }
                }
              ]
            }]
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          workText = data.candidates[0].content.parts[0].text;
        }
      } else {
        workText = '[File uploaded - text extraction would be implemented for this file type]';
      }
    }

    // Build grading prompt
    let gradingPrompt = `You are an expert teacher and grader. Your task is to grade student work and provide detailed feedback.

`;
    
    if (rubric && rubric.trim()) {
      gradingPrompt += `Grading Rubric/Criteria:
${rubric}

`;
    } else {
      gradingPrompt += `Use standard academic grading criteria focusing on:
- Content accuracy and understanding
- Clarity and organization
- Grammar and writing quality
- Completeness of response

`;
    }
    
    gradingPrompt += `Student Work to Grade:
${workText}

Please provide:
1. **Overall Grade/Score** (e.g., 85/100 or A-)
2. **Strengths** - What the student did well
3. **Areas for Improvement** - Specific areas that need work
4. **Detailed Feedback** - Point-by-point comments
5. **Suggestions** - How the student can improve

Format your response clearly with sections and bullet points.`;

    // Generate grading using Gemini
    const gradingResult = await restGeminiService.generateResponse(gradingPrompt, {}, []);
    
    res.json({
      success: true,
      grading: gradingResult
    });
  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to grade work', 
      error: error.message 
    });
  }
});

// Teacher Content Management Routes
router.get('/videos', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const videos = await Video.find({ createdBy: teacherId }).sort({ createdAt: -1 });
    res.json({ success: true, data: videos });
  } catch (error) {
    console.error('Get teacher videos error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

// Test endpoint without middleware
router.post('/videos-test', async (req, res) => {
  try {
    console.log('=== VIDEO TEST ENDPOINT ===');
    console.log('Raw request body:', req.body);
    console.log('Headers:', req.headers);
    
    const { title, description, subject, duration, videoUrl, difficulty } = req.body;
    
    // Simple test video creation
    const testVideo = new Video({
      title: title || 'Test Video',
      description: description || 'Test Description',
      subjectId: subject || 'test',
      duration: parseInt(duration) * 60 || 3600,
      videoUrl: videoUrl || 'https://test.com',
      youtubeUrl: videoUrl || 'https://test.com',
      isYouTubeVideo: true,
      difficulty: 'beginner',
      createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // Test ObjectId
      adminId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // Test ObjectId
      isPublished: true
    });
    
    console.log('Test video object:', testVideo);
    await testVideo.save();
    console.log('Test video saved successfully:', testVideo._id);
    
    res.json({ success: true, message: 'Test video created', data: testVideo });
  } catch (error) {
    console.error('=== TEST VIDEO ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    res.status(500).json({ success: false, message: 'Test failed', error: error.message, details: error });
  }
});

router.post('/videos', async (req, res) => {
  try {
    const teacherId = req.teacherId || req.userId || req.user?._id;
    const { title, description, subject, duration, videoUrl, difficulty } = req.body;
    
    console.log('Creating video with data:', { title, description, subject, duration, videoUrl, difficulty, teacherId });
    console.log('req.adminId:', req.adminId);
    console.log('req.user:', req.user);
    console.log('req.userId:', req.userId);
    console.log('req.teacherId:', req.teacherId);
    console.log('teacherId type:', typeof teacherId);
    console.log('teacherId value:', teacherId);
    
    if (!teacherId) {
      console.error('No teacher ID found in request');
      return res.status(400).json({ success: false, message: 'Teacher ID not found' });
    }
    
    // Convert duration to number (assuming it's in minutes)
    const durationInSeconds = parseInt(duration) * 60;
    console.log('durationInSeconds:', durationInSeconds);
    
    const videoData = {
      title,
      description,
      subjectId: subject, // Use subject as subjectId
      duration: durationInSeconds, // Convert to seconds
      videoUrl: videoUrl || '',
      youtubeUrl: videoUrl || '',
      isYouTubeVideo: !!videoUrl,
      difficulty: difficulty || 'beginner',
      createdBy: new mongoose.Types.ObjectId(teacherId),
      adminId: req.adminId ? new mongoose.Types.ObjectId(req.adminId) : new mongoose.Types.ObjectId(teacherId),
      isPublished: true
    };
    
    console.log('Video data to save:', videoData);
    
    const newVideo = new Video(videoData);

    await newVideo.save();
    console.log('Video created successfully:', newVideo._id);
    res.json({ success: true, data: newVideo });
  } catch (error) {
    console.error('Create teacher video error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to create video', error: error.message });
  }
});

router.get('/assessments', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const assessments = await Assessment.find({ createdBy: teacherId }).sort({ createdAt: -1 });
    res.json({ success: true, data: assessments });
  } catch (error) {
    console.error('Get teacher assessments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assessments' });
  }
});

router.post('/assessments', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const { title, description, subject, questions, timeLimit, difficulty } = req.body;
    
    console.log('Creating assessment with data:', { title, description, subject, questions, timeLimit, difficulty, teacherId });
    console.log('req.adminId:', req.adminId);
    
    const newAssessment = new Assessment({
      title,
      description,
      subjectIds: [subject], // Use subject as subjectIds array
      questions: questions ? JSON.parse(questions) : [],
      duration: parseInt(timeLimit) || 30, // Convert to number
      difficulty: difficulty || 'beginner',
      createdBy: new mongoose.Types.ObjectId(teacherId),
      adminId: req.adminId ? new mongoose.Types.ObjectId(req.adminId) : new mongoose.Types.ObjectId(teacherId),
      isPublished: true
    });

    await newAssessment.save();
    console.log('Assessment created successfully:', newAssessment._id);
    res.json({ success: true, data: newAssessment });
  } catch (error) {
    console.error('Create teacher assessment error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to create assessment', error: error.message });
  }
});

// Teacher Student Management Routes
router.get('/students', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    
    // Get teacher's assigned classes
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    // Get students from teacher's assigned classes AND assigned to the same admin as the teacher
    let students = [];
    if (teacher.assignedClassIds && teacher.assignedClassIds.length > 0) {
      students = await User.find({ 
        role: 'student',
        classNumber: { $in: teacher.assignedClassIds },
        assignedAdmin: teacher.adminId  // Filter by teacher's admin
      }).select('-password').sort({ createdAt: -1 });
    }
    
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
});

// Get all students with their recent performance
router.get('/students/performance', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    
    // Get teacher's assigned classes
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    // Get students from teacher's assigned classes AND assigned to the same admin as the teacher
    let students = [];
    if (teacher.assignedClassIds && teacher.assignedClassIds.length > 0) {
      // First, get the Class documents to find their ObjectIds
      const Class = (await import('../models/Class.js')).default;
      const classDocs = await Class.find({
        $or: [
          { _id: { $in: teacher.assignedClassIds } },
          { classNumber: { $in: teacher.assignedClassIds } }
        ],
        isActive: true
      }).select('_id classNumber section');

      const classObjectIds = classDocs.map(c => c._id);
      
      // Get students assigned to these classes by assignedClass ObjectId
      students = await User.find({ 
        role: 'student',
        assignedClass: { $in: classObjectIds },
        assignedAdmin: teacher.adminId  // Filter by teacher's admin
      })
      .populate({
        path: 'assignedClass',
        select: '_id name classNumber section description assignedSubjects',
        populate: {
          path: 'assignedSubjects',
          select: '_id name'
        }
      })
      .select('-password')
      .sort({ createdAt: -1 });
    }

    // Get student IDs
    const studentIds = students.map(s => s._id);

    // Import ExamResult model
    const ExamResult = (await import('../models/ExamResult.js')).default;

    // Get recent exam results for all students (latest result per exam)
    // Populate examId to get subject information
    const Exam = (await import('../models/Exam.js')).default;
    const examResults = await ExamResult.find({ 
      userId: { $in: studentIds }
    })
    .populate('examId', 'subject title')
    .sort({ completedAt: -1 });

    // Group exam results by student
    const performanceMap = new Map();
    examResults.forEach(result => {
      const userId = result.userId.toString();
      if (!performanceMap.has(userId)) {
        performanceMap.set(userId, {
          recentExam: null,
          recentMarks: null,
          recentPercentage: null,
          totalExams: 0,
          averageMarks: 0
        });
      }
      const perf = performanceMap.get(userId);
      perf.totalExams += 1;
      
      // Set the most recent exam result
      if (!perf.recentExam || new Date(result.completedAt) > new Date(perf.recentExam.completedAt)) {
        perf.recentExam = result;
        perf.recentMarks = result.obtainedMarks;
        perf.recentPercentage = result.percentage;
      }
    });

    // Calculate average marks for each student
    const marksByStudent = {};
    examResults.forEach(result => {
      const userId = result.userId.toString();
      if (!marksByStudent[userId]) marksByStudent[userId] = [];
      marksByStudent[userId].push(result.obtainedMarks);
    });

    Object.keys(marksByStudent).forEach(userId => {
      const marks = marksByStudent[userId];
      const perf = performanceMap.get(userId);
      if (perf) {
        perf.averageMarks = marks.reduce((a, b) => a + b, 0) / marks.length;
      }
    });

    // Calculate overall progress for each student (same as student dashboard)
    // Overall progress = average of all subject progress (combining exam and learning path progress)
    const Subject = (await import('../models/Subject.js')).default;
    const Content = (await import('../models/Content.js')).default;
    const UserProgress = (await import('../models/UserProgress.js')).default;
    
    const studentsWithPerformance = await Promise.all(students.map(async (student) => {
      const perf = performanceMap.get(student._id.toString()) || {
        recentExam: null,
        recentMarks: null,
        recentPercentage: null,
        totalExams: 0,
        averageMarks: 0
      };
      
      // Get student's board
      let studentBoard = student.board;
      if (!studentBoard && student.assignedAdmin) {
        const admin = await User.findById(student.assignedAdmin).select('board');
        if (admin && admin.board) {
          studentBoard = admin.board;
        }
      }
      
      // Get subjects assigned to student's class
      let subjectsList = [];
      if (student.assignedClass && student.assignedClass.assignedSubjects) {
        subjectsList = student.assignedClass.assignedSubjects;
      } else if (studentBoard) {
        // Fallback: get all subjects for student's board
        subjectsList = await Subject.find({ 
          board: studentBoard, 
          isActive: true 
        }).select('_id name');
      }
      
      // Calculate exam progress per subject
      const examProgressBySubject = new Map();
      const studentExamResults = examResults.filter(r => r.userId.toString() === student._id.toString());
      
      studentExamResults.forEach(result => {
        // Get subject from examId if populated, or from examTitle parsing
        let subjectId = null;
        if (result.examId && result.examId.subject) {
          subjectId = result.examId.subject.toString();
        }
        
        if (subjectId && result.percentage !== null && result.percentage !== undefined) {
          if (!examProgressBySubject.has(subjectId)) {
            examProgressBySubject.set(subjectId, []);
          }
          examProgressBySubject.get(subjectId).push(result.percentage);
        }
      });
      
      // Calculate average exam progress per subject
      const examProgressMap = new Map();
      examProgressBySubject.forEach((percentages, subjectId) => {
        const avgProgress = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
        examProgressMap.set(subjectId, Math.round(avgProgress));
      });
      
      // Calculate learning path progress per subject (from UserProgress and Content)
      const learningPathProgressMap = new Map();
      if (studentBoard && subjectsList.length > 0) {
        for (const subject of subjectsList) {
          const subjectId = subject._id ? subject._id.toString() : subject.toString();
          try {
            // Get total content count for this subject
            const totalContent = await Content.countDocuments({
              subject: subjectId,
              board: studentBoard.toUpperCase(),
              isActive: true,
              isExclusive: true
            });
            
            if (totalContent > 0) {
              // Get completed content count from UserProgress
              // Note: UserProgress might track videos/assessments, not Content directly
              // For now, we'll use a simplified approach
              // In a real implementation, you'd need to track Content completion in UserProgress
              const completedCount = 0; // Placeholder - would need Content completion tracking
              const progress = totalContent > 0 ? Math.round((completedCount / totalContent) * 100) : 0;
              if (progress > 0) {
                learningPathProgressMap.set(subjectId, progress);
              }
            }
          } catch (error) {
            console.error(`Error calculating learning path progress for subject ${subjectId}:`, error);
          }
        }
      }
      
      // Merge exam and learning path progress (same logic as student dashboard)
      const mergedProgress = new Map();
      
      // Add exam-based progress
      examProgressMap.forEach((progress, subjectId) => {
        const subject = subjectsList.find(s => (s._id || s).toString() === subjectId);
        const subjectName = subject?.name || 'Subject';
        mergedProgress.set(subjectId, {
          progress: progress,
          name: subjectName
        });
      });
      
      // Merge with learning path progress (average if both exist)
      learningPathProgressMap.forEach((progress, subjectId) => {
        const subject = subjectsList.find(s => (s._id || s).toString() === subjectId);
        const subjectName = subject?.name || 'Subject';
        
        if (mergedProgress.has(subjectId)) {
          // Average if both exist
          const existing = mergedProgress.get(subjectId);
          mergedProgress.set(subjectId, {
            ...existing,
            progress: Math.round((existing.progress + progress) / 2)
          });
        } else {
          // Add new entry
          mergedProgress.set(subjectId, {
            progress: progress,
            name: subjectName
          });
        }
      });
      
      // Calculate overall progress as average of all subject progress
      const subjectProgressValues = Array.from(mergedProgress.values()).map(s => s.progress);
      const overallProgress = subjectProgressValues.length > 0
        ? Math.round(subjectProgressValues.reduce((sum, p) => sum + p, 0) / subjectProgressValues.length)
        : 0;
      
      return {
        ...student.toObject(),
        performance: {
          recentExamTitle: perf.recentExam?.examTitle || null,
          recentMarks: perf.recentMarks,
          recentPercentage: perf.recentPercentage,
          totalExams: perf.totalExams,
          averageMarks: Math.round(perf.averageMarks * 100) / 100,
          overallProgress: overallProgress
        }
      };
    }));
    
    res.json({ success: true, data: studentsWithPerformance });
  } catch (error) {
    console.error('Get students performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students performance' });
  }
});

router.get('/students/:studentId/performance', async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.teacherId;
    
    // Get teacher's assigned classes
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    // Verify student is in teacher's assigned classes AND assigned to the same admin as the teacher
    const student = await User.findOne({ 
      _id: studentId,
      role: 'student',
      classNumber: { $in: teacher.assignedClassIds || [] },
      assignedAdmin: teacher.adminId  // Filter by teacher's admin
    });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found or not assigned to this teacher' });
    }

    // Import ExamResult model
    const ExamResult = (await import('../models/ExamResult.js')).default;

    // Get student's exam results (using userId, not studentId)
    const examResults = await ExamResult.find({ userId: studentId }).sort({ completedAt: -1 });
    
    res.json({ success: true, data: examResults });
  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student performance' });
  }
});

// Get Asli Prep content for teacher's assigned subjects
router.get('/asli-prep-content', async (req, res) => {
  try {
    const { subject, type, topic } = req.query;
    const teacherId = req.teacherId;
    
    console.log('📚 Fetching Asli Prep content for teacher:', teacherId);
    console.log('Query params:', { subject, type, topic });
    
    // Get teacher with assigned subjects
    const teacher = await Teacher.findById(teacherId).populate('subjects');
    
    if (!teacher) {
      console.log('❌ Teacher not found');
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Get teacher's assigned subject IDs
    const assignedSubjectIds = teacher.subjects?.map(s => s._id || s) || [];
    
    if (assignedSubjectIds.length === 0) {
      console.log('❌ Teacher has no assigned subjects');
      return res.json({
        success: true,
        data: []
      });
    }
    
    console.log(`📋 Teacher has ${assignedSubjectIds.length} assigned subjects`);
    
    // Build query - filter by teacher's assigned subjects
    const query = {
      subject: { $in: assignedSubjectIds },
      isActive: true,
      isExclusive: true
    };
    
    // If specific subject is requested, validate it's in teacher's assigned subjects
    if (subject && subject !== 'all') {
      if (mongoose.Types.ObjectId.isValid(subject)) {
        const subjectId = new mongoose.Types.ObjectId(subject);
        if (assignedSubjectIds.some(id => id.toString() === subjectId.toString())) {
          query.subject = subjectId;
        } else {
          console.log('⚠️ Requested subject not in teacher\'s assigned subjects');
          return res.json({
            success: true,
            data: []
          });
        }
      }
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (topic && topic.trim()) {
      query.topic = { $regex: topic.trim(), $options: 'i' };
    }
    
    console.log('📋 Content query:', JSON.stringify(query, null, 2));
    
    const contents = await Content.find(query)
      .populate('subject', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${contents.length} contents for teacher's subjects`);
    
    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('❌ Error fetching Asli Prep content for teacher:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch content', error: error.message });
  }
});

export default router;
