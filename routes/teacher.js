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
    const teacherId = req.teacherId;
    const { title, description, subject, duration, videoUrl, difficulty } = req.body;
    
    console.log('Creating video with data:', { title, description, subject, duration, videoUrl, difficulty, teacherId });
    console.log('req.adminId:', req.adminId);
    console.log('req.user:', req.user);
    console.log('teacherId type:', typeof teacherId);
    console.log('teacherId value:', teacherId);
    
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
