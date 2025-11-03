import express from 'express';
import {
  verifyToken,
  verifySuperAdmin,
  authorizeRoles
} from '../middleware/auth.js';
import {
  superAdminLogin,
  getDashboardStats,
  getAllAdmins,
  getAdminAnalytics,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllUsers,
  createUser,
  getAllTeachers,
  createTeacher,
  getAllCourses,
  createCourse,
  getAnalytics,
  getRealTimeAnalytics,
  getSubscriptions,
  exportData
} from '../controllers/superAdminController.js';
import {
  getAllBoards,
  getBoardDashboard,
  createSubject,
  getSubjectsByBoard,
  deleteSubject,
  uploadContent,
  getContentByBoard,
  deleteContent,
  getBoardAnalytics,
  initializeBoards
} from '../controllers/boardController.js';
import {
  createExam,
  getAllExams,
  getExamsByBoard,
  updateExam,
  deleteExam,
  addQuestion
} from '../controllers/superAdminExamController.js';

const router = express.Router();

// Public routes
router.post('/login', superAdminLogin);

// Protected routes - require super admin authentication
router.use(verifyToken);
router.use(verifySuperAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/analytics/realtime', getRealTimeAnalytics);

// Admin Management
router.get('/admins', getAllAdmins);
router.get('/admins/:adminId/analytics', getAdminAnalytics);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);

// User Management (Global)
router.get('/users', getAllUsers);
router.post('/users', createUser);

// Teacher Management (Global)
router.get('/teachers', getAllTeachers);
router.post('/teachers', createTeacher);

// Course Management (Global)
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);

// Analytics & Reports
router.get('/subscriptions', getSubscriptions);
router.get('/export', exportData);

// Board Management Routes
router.get('/boards', getAllBoards);
router.get('/boards/analytics/comparison', getBoardAnalytics); // Must come before parameterized routes
router.get('/boards/:boardCode/dashboard', getBoardDashboard);
router.get('/boards/:boardCode/analytics', getBoardAnalytics);

// Subject Management (Super Admin only)
router.post('/subjects', createSubject);
router.get('/boards/:board/subjects', getSubjectsByBoard);
router.delete('/subjects/:subjectId', deleteSubject);

// Content Management (Super Admin only - Asli Prep Exclusive)
router.post('/content', uploadContent);
router.get('/boards/:board/content', getContentByBoard);
router.delete('/content/:contentId', deleteContent);

// Exam Management (Super Admin only)
// Note: Order matters - specific routes before parameterized ones
router.post('/exams', createExam);
router.get('/exams', getAllExams);
router.get('/boards/:boardCode/exams', getExamsByBoard);
router.get('/exams/:examId', async (req, res) => {
  try {
    console.log('📋 Fetching exam by ID:', req.params.examId);
    const Exam = (await import('../models/Exam.js')).default;
    const exam = await Exam.findById(req.params.examId).populate('questions');
    if (!exam) {
      console.log('❌ Exam not found:', req.params.examId);
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    console.log('✅ Exam found:', exam.title, 'Questions:', exam.questions?.length || 0);
    res.json({ success: true, data: exam });
  } catch (error) {
    console.error('❌ Get exam error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch exam', error: error.message });
  }
});
router.put('/exams/:examId', updateExam);
router.delete('/exams/:examId', deleteExam);
router.get('/exams/:examId/questions', async (req, res) => {
  try {
    console.log('📋 Fetching questions for exam:', req.params.examId);
    const Question = (await import('../models/Question.js')).default;
    const questions = await Question.find({ exam: req.params.examId }).sort({ createdAt: -1 });
    console.log(`✅ Found ${questions.length} questions`);
    res.json({ success: true, data: questions });
  } catch (error) {
    console.error('❌ Get questions error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch questions', error: error.message });
  }
});
router.post('/exams/:examId/questions', addQuestion);

// Debug: Log when routes are registered
console.log('✅ Super Admin exam routes registered:', {
  'POST /exams': 'createExam',
  'GET /exams': 'getAllExams',
  'GET /boards/:boardCode/exams': 'getExamsByBoard',
  'PUT /exams/:examId': 'updateExam',
  'DELETE /exams/:examId': 'deleteExam',
  'POST /exams/:examId/questions': 'addQuestion'
});

export default router;