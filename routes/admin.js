import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Video from '../models/Video.js';
import Assessment from '../models/Assessment.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Content from '../models/Content.js';
import {
  verifyToken,
  verifyAdmin,
  extractAdminId,
  authorizeRoles,
  verifyDataOwnership,
  addAdminIdToBody
} from '../middleware/auth.js';
import {
  getAdminDashboardStats,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  assignSubjects,
  assignClasses,
  assignSubjectsToStudent,
  assignClassToStudent,
  assignSubjectsToClass,
  getTeacherDashboardStats,
  getVideos,
  getAssessments,
  getAnalytics,
  getClasses,
  createClass,
  deleteClass
} from '../controllers/adminController.js';
import {
  getViewableExams,
  getExamDetails,
  getStudentExamResults,
  getExamPerformanceAnalytics
} from '../controllers/adminExamViewController.js';

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
router.use(verifyAdmin);
router.use(extractAdminId);

// Dashboard Routes
router.get('/dashboard/stats', getAdminDashboardStats);
router.get('/analytics', getAnalytics);

// Teacher Dashboard Routes
router.get('/teacher/dashboard', getTeacherDashboardStats);

// Student Management Routes
router.get('/students', getStudents);
router.post('/students', addAdminIdToBody, createStudent);
router.put('/students/:id', verifyDataOwnership(User), updateStudent);
router.delete('/students/:id', verifyDataOwnership(User), deleteStudent);
router.post('/students/:studentId/assign-subjects', assignSubjectsToStudent);
router.post('/students/:studentId/assign-class', assignClassToStudent);

// Class Management Routes
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.delete('/classes/:id', deleteClass);
router.post('/classes/:classNumber/assign-subjects', assignSubjectsToClass);

// Teacher Management Routes
router.get('/teachers', getTeachers);
router.post('/teachers', addAdminIdToBody, createTeacher);
router.put('/teachers/:id', verifyDataOwnership(Teacher), updateTeacher);
router.delete('/teachers/:id', verifyDataOwnership(Teacher), deleteTeacher);
router.post('/teachers/:teacherId/assign-subjects', assignSubjects);
router.post('/teachers/:teacherId/assign-classes', assignClasses);

// Video/Course Management Routes - REMOVED (Admins cannot create content)
// router.post('/videos', addAdminIdToBody, createVideo);
// router.put('/videos/:id', verifyDataOwnership(Video), updateVideo);
// router.delete('/videos/:id', verifyDataOwnership(Video), deleteVideo);

// Assessment Management Routes - REMOVED (Admins cannot create assessments)
// router.post('/assessments', addAdminIdToBody, createAssessment);
// router.put('/assessments/:id', verifyDataOwnership(Assessment), updateAssessment);
// router.delete('/assessments/:id', verifyDataOwnership(Assessment), deleteAssessment);

// CSV Upload for Students
router.post('/students/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('CSV upload request received');
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const adminId = req.adminId;
    console.log('Admin ID for CSV upload:', adminId);

    // Convert buffer to string
    const csvData = req.file.buffer.toString('utf8');
    
    // Parse CSV data
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return res.status(400).json({ message: 'CSV file must have at least a header and one data row' });
    }

    // Get header row
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers
    const requiredHeaders = ['name', 'email', 'phone'];
    const classHeader = headers.find(h => h === 'classnumber');
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({ 
        message: `Missing required headers: ${missingHeaders.join(', ')}` 
      });
    }
    
    if (!classHeader) {
      return res.status(400).json({ 
        message: 'Missing class header. Please include "classnumber" column' 
      });
    }

    const createdUsers = [];
    const errors = [];

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        // Create user object
        const userData = {};
        headers.forEach((header, index) => {
          userData[header] = values[index];
        });

        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          errors.push(`Row ${i + 1}: User with email ${userData.email} already exists`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('Password123', 12);

        // Get class number from the class field
        const classNumber = userData.classnumber || 'Unassigned';

        // Create new user and assign to the logged-in admin
        const newUser = new User({
          fullName: userData.name,
          email: userData.email,
          classNumber: classNumber,
          phone: userData.phone,
          password: hashedPassword,
          role: 'student',
          isActive: true,
          assignedAdmin: adminId
        });

        await newUser.save();
        createdUsers.push({
          id: newUser._id,
          name: newUser.fullName,
          email: newUser.email,
          classNumber: newUser.classNumber
        });

      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.json({
      message: `CSV processed successfully. Created ${createdUsers.length} users.`,
      createdUsers,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ message: 'Failed to process CSV file' });
  }
});

// Exam View Routes (Admins can only view Super Admin created exams)
router.get('/exams/viewable', getViewableExams); // View Super Admin created exams for their board
router.get('/exams/:examId/view', getExamDetails); // View exam details
router.get('/exam-results', getStudentExamResults); // View student exam results with filters
router.get('/exams/:examId/analytics', getExamPerformanceAnalytics); // View exam performance analytics

// Get Asli Prep content for admin's board
router.get('/asli-prep-content', async (req, res) => {
  try {
    const { subject, type, topic } = req.query;
    const adminId = req.adminId;
    
    console.log('📚 Fetching Asli Prep content for admin:', adminId);
    console.log('Query params:', { subject, type, topic });
    
    // Get admin to find their board
    const admin = await User.findById(adminId).select('board');
    
    if (!admin) {
      console.log('❌ Admin not found');
      return res.json({
        success: true,
        data: []
      });
    }
    
    const adminBoard = admin.board;
    
    if (!adminBoard) {
      console.log('❌ Admin does not have board assigned');
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Ensure board is uppercase to match Content model
    const boardUpper = adminBoard.toUpperCase();
    console.log('🔍 Admin board:', boardUpper);
    
    // Build query - filter by admin's board
    const query = {
      board: boardUpper,
      isActive: true,
      isExclusive: true
    };
    
    // If specific subject is requested
    if (subject && subject !== 'all') {
      if (mongoose.Types.ObjectId.isValid(subject)) {
        query.subject = subject;
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
    
    console.log(`✅ Found ${contents.length} contents for admin's board ${boardUpper}`);
    
    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('❌ Error fetching Asli Prep content for admin:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch content', error: error.message });
  }
});

// Removed: POST /exams, PUT /exams/:id, DELETE /exams/:id
// Removed: POST /exams/:examId/questions, PUT /questions/:questionId, DELETE /questions/:questionId
// Admins can NO LONGER create, edit, or delete exams

export default router;