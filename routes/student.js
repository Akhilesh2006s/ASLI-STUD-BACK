import express from 'express';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Assessment from '../models/Assessment.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Teacher from '../models/Teacher.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get student's assigned admin and filter content accordingly
const getStudentAdminId = async (req, res, next) => {
  try {
    const student = await User.findById(req.userId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (!student.assignedAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Student not assigned to any admin' 
      });
    }
    
    req.studentAdminId = student.assignedAdmin;
    next();
  } catch (error) {
    console.error('Error getting student admin:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get student's videos (filtered by assigned admin)
router.get('/videos', getStudentAdminId, async (req, res) => {
  try {
    const videos = await Video.find({ 
      adminId: req.studentAdminId,
      isActive: true 
    }).populate('createdBy', 'fullName email');
    
    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Error fetching student videos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

// Get student's assessments (filtered by assigned admin)
router.get('/assessments', getStudentAdminId, async (req, res) => {
  try {
    const assessments = await Assessment.find({ 
      adminId: req.studentAdminId,
      isActive: true 
    }).populate('createdBy', 'fullName email');
    
    res.json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Error fetching student assessments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assessments' });
  }
});

// Get student's exams (filtered by assigned admin)
router.get('/exams', getStudentAdminId, async (req, res) => {
  try {
    const exams = await Exam.find({ 
      adminId: req.studentAdminId,
      isActive: true 
    }).populate('createdBy', 'fullName email').populate('questions');
    
    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('Error fetching student exams:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
});

// Get student's teachers (filtered by assigned admin)
router.get('/teachers', getStudentAdminId, async (req, res) => {
  try {
    const teachers = await Teacher.find({ 
      adminId: req.studentAdminId,
      isActive: true 
    }).populate('createdBy', 'fullName email');
    
    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error('Error fetching student teachers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
});

// Get specific exam with questions (filtered by assigned admin)
router.get('/exams/:examId', getStudentAdminId, async (req, res) => {
  try {
    const { examId } = req.params;
    
    const exam = await Exam.findOne({ 
      _id: examId,
      adminId: req.studentAdminId,
      isActive: true 
    }).populate('questions');
    
    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exam' });
  }
});

// Get student's subjects (filtered by assigned admin)
router.get('/subjects', getStudentAdminId, async (req, res) => {
  try {
    // Get subjects from teachers assigned to the same admin
    const teachers = await Teacher.find({ 
      adminId: req.studentAdminId,
      isActive: true 
    }).select('subjects');
    
    // Extract unique subjects
    const subjects = [...new Set(teachers.flatMap(teacher => teacher.subjects || []))];
    
    res.json({
      success: true,
      data: subjects.map(subject => ({ name: subject, id: subject }))
    });
  } catch (error) {
    console.error('Error fetching student subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
  }
});

export default router;
