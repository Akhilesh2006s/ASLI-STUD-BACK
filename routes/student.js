import express from 'express';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Assessment from '../models/Assessment.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
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

// Get student's videos - filtered by assigned teacher (through classes)
router.get('/videos', async (req, res) => {
  try {
    const { subject } = req.query;
    
    // Get student's class number
    const student = await User.findById(req.userId);
    console.log('Student videos request - Student:', {
      id: student?._id,
      classNumber: student?.classNumber,
      email: student?.email
    });
    
    if (!student || !student.classNumber) {
      console.log('No student or classNumber found');
      return res.json({
        success: true,
        data: [],
        videos: []
      });
    }
    
    // Find teachers who have this student's class assigned
    // Handle both string and number formats
    const studentClass = String(student.classNumber);
    const teachers = await Teacher.find({
      assignedClassIds: { $in: [studentClass, student.classNumber] }
    }).select('_id email assignedClassIds');
    
    console.log('Found teachers for class:', {
      studentClass,
      teachers: teachers.map(t => ({
        id: t._id,
        email: t.email,
        assignedClassIds: t.assignedClassIds
      }))
    });
    
    const teacherIds = teachers.map(t => t._id);
    
    if (teacherIds.length === 0) {
      console.log('No teachers found for student class');
      return res.json({
        success: true,
        data: [],
        videos: []
      });
    }
    
    // Build query - only show videos from teachers assigned to student's classes
    let query = { 
      isPublished: true,
      createdBy: { $in: teacherIds }
    };
    
    // Add subject filter if provided (try both ID and name matching)
    if (subject) {
      // Try to find subject by ID to get its name
      try {
        const subjectDoc = await Subject.findById(subject);
        if (subjectDoc) {
          // Match by both ID and name
          query.$or = [
            { subjectId: subject },
            { subjectId: subjectDoc.name },
            { subjectId: subjectDoc._id.toString() }
          ];
        } else {
          // If subject ID not found, try matching by name directly
          query.$or = [
            { subjectId: subject },
            { subjectId: { $regex: subject, $options: 'i' } }
          ];
        }
      } catch (err) {
        // Fallback: match by subject ID or name
        query.$or = [
          { subjectId: subject },
          { subjectId: { $regex: subject, $options: 'i' } }
        ];
      }
    }
    
    console.log('Video query:', query);
    const videos = await Video.find(query)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    
    console.log('Found videos:', videos.length);
    
    res.json({
      success: true,
      data: videos,
      videos: videos
    });
  } catch (error) {
    console.error('Error fetching student videos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

// Get student's assessments - filtered by assigned teacher (through classes)
router.get('/assessments', async (req, res) => {
  try {
    const { subject } = req.query;
    
    // Get student's class number
    const student = await User.findById(req.userId);
    console.log('Student assessments request - Student:', {
      id: student?._id,
      classNumber: student?.classNumber,
      email: student?.email
    });
    
    if (!student || !student.classNumber) {
      console.log('No student or classNumber found');
      return res.json({
        success: true,
        data: [],
        assessments: [],
        quizzes: []
      });
    }
    
    // Find teachers who have this student's class assigned
    // Handle both string and number formats
    const studentClass = String(student.classNumber);
    const teachers = await Teacher.find({
      assignedClassIds: { $in: [studentClass, student.classNumber] }
    }).select('_id email assignedClassIds');
    
    console.log('Found teachers for class:', {
      studentClass,
      teachers: teachers.map(t => ({
        id: t._id,
        email: t.email,
        assignedClassIds: t.assignedClassIds
      }))
    });
    
    const teacherIds = teachers.map(t => t._id);
    
    if (teacherIds.length === 0) {
      console.log('No teachers found for student class');
      return res.json({
        success: true,
        data: [],
        assessments: [],
        quizzes: []
      });
    }
    
    // Build query - only show assessments from teachers assigned to student's classes
    let query = { 
      isPublished: true,
      createdBy: { $in: teacherIds }
    };
    
    // Add subject filter if provided (try both ID and name matching)
    if (subject) {
      // Try to find subject by ID to get its name
      try {
        const subjectDoc = await Subject.findById(subject);
        if (subjectDoc) {
          // Match by both ID and name in subjectIds array
          query.$or = [
            { subjectIds: { $in: [subject] } },
            { subjectIds: { $in: [subjectDoc.name] } },
            { subjectIds: { $in: [subjectDoc._id.toString()] } }
          ];
        } else {
          // If subject ID not found, try matching by name directly
          query.$or = [
            { subjectIds: { $in: [subject] } },
            { subjectIds: { $regex: subject, $options: 'i' } }
          ];
        }
      } catch (err) {
        // Fallback: match by subject ID or name
        query.$or = [
          { subjectIds: { $in: [subject] } },
          { subjectIds: { $regex: subject, $options: 'i' } }
        ];
      }
    }
    
    console.log('Assessment query:', query);
    const assessments = await Assessment.find(query)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    
    console.log('Found assessments:', assessments.length);
    
    res.json({
      success: true,
      data: assessments,
      assessments: assessments,
      quizzes: assessments
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
