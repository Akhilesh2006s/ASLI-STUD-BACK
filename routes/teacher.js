import express from 'express';
import multer from 'multer';
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

const router = express.Router();

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

router.post('/videos', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const { title, description, subject, duration, videoUrl, difficulty } = req.body;
    
    console.log('Creating video with data:', { title, description, subject, duration, videoUrl, difficulty, teacherId });
    
    const newVideo = new Video({
      title,
      description,
      subject,
      duration,
      videoUrl: videoUrl || '',
      difficulty: difficulty || 'medium',
      createdBy: teacherId,
      adminId: req.adminId,
      isPublished: true
    });

    await newVideo.save();
    console.log('Video created successfully:', newVideo._id);
    res.json({ success: true, data: newVideo });
  } catch (error) {
    console.error('Create teacher video error:', error);
    console.error('Error details:', error.message);
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
    
    const newAssessment = new Assessment({
      title,
      description,
      subject,
      questions: questions ? JSON.parse(questions) : [],
      duration: timeLimit,
      difficulty: difficulty || 'medium',
      createdBy: teacherId,
      adminId: req.adminId,
      isPublished: true
    });

    await newAssessment.save();
    console.log('Assessment created successfully:', newAssessment._id);
    res.json({ success: true, data: newAssessment });
  } catch (error) {
    console.error('Create teacher assessment error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create assessment', error: error.message });
  }
});

// Teacher Student Management Routes
router.get('/students', async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const students = await User.find({ 
      role: 'student',
      assignedTeacher: teacherId 
    }).select('-password').sort({ createdAt: -1 });
    
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
});

router.get('/students/:studentId/performance', async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.teacherId;
    
    // Verify student is assigned to this teacher
    const student = await User.findOne({ 
      _id: studentId,
      assignedTeacher: teacherId 
    });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get student's exam results
    const examResults = await ExamResult.find({ studentId }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: examResults });
  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student performance' });
  }
});

export default router;
