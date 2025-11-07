import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
  initializeBoards,
  getAllClasses
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

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for content file uploads
const contentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/content');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'content-' + uniqueSuffix + ext);
  }
});

// File filter based on content type
const contentFileFilter = (req, file, cb) => {
  const contentType = req.body.contentType || req.query.contentType;
  
  // Document types (TextBook, Workbook, Material)
  const documentMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
  ];
  
  // Video types
  const videoMimes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska'
  ];
  
  // Audio types
  const audioMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/webm',
    'audio/x-m4a'
  ];
  
  if (contentType === 'TextBook' || contentType === 'Workbook' || contentType === 'Material') {
    if (documentMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only document files (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX) are allowed for this content type!'), false);
    }
  } else if (contentType === 'Video') {
    if (videoMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MPEG, MOV, AVI, WEBM, MKV) are allowed!'), false);
    }
  } else if (contentType === 'Audio') {
    if (audioMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (MP3, WAV, OGG, AAC, M4A) are allowed!'), false);
    }
  } else {
    cb(new Error('Invalid content type!'), false);
  }
};

const contentUpload = multer({
  storage: contentStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: contentFileFilter
});

// Configure multer for thumbnail image uploads
const thumbnailStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/content/thumbnails');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'thumbnail-' + uniqueSuffix + ext);
  }
});

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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

// Class Management (Super Admin only)
router.get('/classes', getAllClasses);

// ============================================
// Content Management Routes
// IMPORTANT: More specific routes MUST come before less specific ones
// Order: /content/upload-file -> /content/upload-thumbnail -> /content -> /content/:id
// ============================================

// File upload endpoint for content (MUST be before /content route)
// Using explicit route definition to ensure it's registered
router.post('/content/upload-file', (req, res, next) => {
  console.log('✅✅✅ POST /content/upload-file - Route matched! ✅✅✅');
  console.log('Full URL:', req.originalUrl);
  console.log('Request query:', req.query);
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers['authorization'] ? 'Present' : 'Missing'
  });
  next();
}, (req, res, next) => {
  // Multer middleware with error handling
  contentUpload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false,
          message: 'File too large. Maximum size is 100MB.' 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: err.message || 'File upload error'
      });
    }
    next();
  });
}, (req, res) => {
  try {
    console.log('File upload handler - req.file:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file provided' 
      });
    }

    const fileUrl = `/uploads/content/${req.file.filename}`;
    console.log('✅ Content file uploaded successfully:', fileUrl);
    
    res.json({ 
      success: true,
      fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Failed to process uploaded file:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process file',
      error: error.message 
    });
  }
});

// Thumbnail image upload endpoint for content (MUST be before /content route)
router.post('/content/upload-thumbnail', (req, res, next) => {
  console.log('✅✅✅ POST /content/upload-thumbnail - Route matched! ✅✅✅');
  console.log('Full URL:', req.originalUrl);
  
  thumbnailUpload.single('thumbnail')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false,
          message: 'File too large. Maximum size is 5MB.' 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: err.message || 'File upload error'
      });
    }
    next();
  });
}, (req, res) => {
  try {
    console.log('Thumbnail upload handler - req.file:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file provided' 
      });
    }

    const thumbnailUrl = `/uploads/content/thumbnails/${req.file.filename}`;
    console.log('✅ Thumbnail uploaded successfully:', thumbnailUrl);
    
    res.json({ 
      success: true,
      thumbnailUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Failed to upload thumbnail:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload thumbnail',
      error: error.message 
    });
  }
});

// Content CRUD routes (less specific routes come after specific ones)
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

// Log all registered content routes for debugging
console.log('✅ Super Admin content routes registered (in order):', {
  'POST /content/upload-file': 'File upload (MUST be first)',
  'POST /content/upload-thumbnail': 'Thumbnail upload',
  'POST /content': 'Create content',
  'GET /boards/:board/content': 'Get content by board',
  'DELETE /content/:contentId': 'Delete content'
});

export default router;