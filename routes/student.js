import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Assessment from '../models/Assessment.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Content from '../models/Content.js';
import { verifyToken } from '../middleware/auth.js';
import {
  getStudentExamRanking,
  getAllStudentRankings
} from '../controllers/studentRankingController.js';

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

// Get student's videos - filtered by assigned subjects and teachers teaching those subjects
router.get('/videos', async (req, res) => {
  try {
    const { subject } = req.query;
    
    // Check if userId is set
    if (!req.userId) {
      console.error('req.userId is not set in videos endpoint');
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated',
        data: [],
        videos: []
      });
    }
    
    // Get student to find their board (from assigned admin)
    const student = await User.findById(req.userId)
      .populate('assignedAdmin', 'board');
    
    console.log('📚 Student videos request - Student:', {
      id: student?._id?.toString(),
      email: student?.email,
      role: student?.role,
      board: student?.board || (student?.assignedAdmin?.board),
      requestedSubject: subject || 'none'
    });
    
    if (!student) {
      console.log('Student not found');
      return res.json({
        success: true,
        data: [],
        videos: []
      });
    }
    
    // Get student's board to find subjects
    const studentBoard = student.board || (student.assignedAdmin?.board);
    
    if (!studentBoard) {
      return res.json({
        success: true,
        data: [],
        videos: [],
        message: 'No board assigned. Please contact your admin.'
      });
    }
    
    // Get all subjects for student's board (same subjects admin sees in Subject Management)
    const Subject = (await import('../models/Subject.js')).default;
    const boardSubjects = await Subject.find({ 
      board: studentBoard, 
      isActive: true 
    }).sort({ name: 1 });
    
    if (boardSubjects.length === 0) {
      console.log('No subjects found for board:', studentBoard);
      return res.json({
        success: true,
        data: [],
        videos: [],
        message: 'No subjects available for your board.'
      });
    }
    
    const boardSubjectIds = boardSubjects.map(s => s._id?.toString() || s._id.toString());
    
    // Find teachers assigned to the same admin who teach any of these board subjects
    const teachers = await Teacher.find({
      adminId: student.assignedAdmin,
      subjects: { $in: boardSubjects.map(s => s._id) },
      isActive: true
    }).select('_id subjects').lean();
    
    const teacherIds = teachers.map(t => t._id);
    
    // Build a map of which teacher teaches which subject
    const teacherSubjectMap = new Map();
    teachers.forEach(teacher => {
      if (teacher.subjects && Array.isArray(teacher.subjects)) {
        teacher.subjects.forEach(subjId => {
          const subjIdStr = subjId.toString();
          if (boardSubjectIds.includes(subjIdStr)) {
            if (!teacherSubjectMap.has(subjIdStr)) {
              teacherSubjectMap.set(subjIdStr, []);
            }
            teacherSubjectMap.get(subjIdStr).push(teacher._id.toString());
          }
        });
      }
    });
    
    console.log(`Found ${teachers.length} teachers teaching ${boardSubjects.length} board subjects`);
    
    // Build query - show videos from teachers teaching board subjects
    // Note: Video.subjectId is a String, so we need to match it as a string
    let query = { 
      isPublished: true,
      isActive: true,
      createdBy: { $in: teacherIds },
      adminId: student.assignedAdmin
    };
    
    // Add subject filter if provided
    if (subject) {
      // Validate subject belongs to student's board
      const subjectObj = boardSubjects.find(s => 
        (s._id?.toString() === subject.toString()) || 
        (s._id.toString() === subject.toString())
      );
      
      if (!subjectObj) {
        return res.json({
          success: true,
          data: [],
          videos: [],
          message: 'This subject is not available for your board.'
        });
      }
      
      // Get teachers specifically assigned to this subject
      const subjectTeachers = teacherSubjectMap.get(subject.toString()) || [];
      if (subjectTeachers.length === 0) {
        console.log(`No teachers assigned to subject ${subject}`);
        return res.json({
          success: true,
          data: [],
          videos: [],
          message: 'No teacher assigned to this subject yet.'
        });
      }
      
      try {
        const subjectDoc = await Subject.findById(subject).lean();
        const subjectName = subjectDoc ? subjectDoc.name : null;
        const subjectIdStr = subject.toString();
        
        console.log('Subject lookup for videos:', { subject, subjectName, subjectIdStr });
        
        // Build subject matching conditions (Video.subjectId is stored as String)
        const subjectConditions = [
          { subjectId: subject },
          { subjectId: subjectIdStr }
        ];
        
        if (mongoose.Types.ObjectId.isValid(subject)) {
          const subjectObjId = new mongoose.Types.ObjectId(subject);
          subjectConditions.push({ subjectId: subjectObjId.toString() });
        }
        
        if (subjectName) {
          subjectConditions.push({ subjectId: subjectName });
          subjectConditions.push({ subjectId: { $regex: subjectName, $options: 'i' } });
        }
        
        // Add subject filter to query - only from teachers assigned to this subject
        query = {
          $and: [
            { isPublished: true },
            { isActive: true },
            { createdBy: { $in: subjectTeachers } },
            { adminId: student.assignedAdmin },
            { $or: subjectConditions }
          ]
        };
      } catch (err) {
        console.error('Error in video subject filter:', err);
        // Continue with basic query if subject filter fails
      }
    } else {
      // No subject filter - show all videos from teachers teaching board subjects
      // Only show content for subjects that have assigned teachers
      const subjectConditions = [];
      const validTeacherIds = [];
      
      boardSubjects.forEach(subj => {
        const subjIdStr = subj._id?.toString() || subj._id.toString();
        const teachersForSubject = teacherSubjectMap.get(subjIdStr);
        
        if (teachersForSubject && teachersForSubject.length > 0) {
          // This subject has assigned teachers, include it
          const conditions = [
            { subjectId: subjIdStr },
            { subjectId: subj._id.toString() }
          ];
          if (mongoose.Types.ObjectId.isValid(subjIdStr)) {
            const subjectObjId = new mongoose.Types.ObjectId(subjIdStr);
            conditions.push({ subjectId: subjectObjId.toString() });
          }
          subjectConditions.push(...conditions);
          validTeacherIds.push(...teachersForSubject);
        }
      });
      
      if (subjectConditions.length > 0 && validTeacherIds.length > 0) {
        query = {
          $and: [
            { isPublished: true },
            { isActive: true },
            { createdBy: { $in: [...new Set(validTeacherIds)] } },
            { adminId: student.assignedAdmin },
            { $or: subjectConditions }
          ]
        };
      } else {
        // No content available - subjects exist but no teachers assigned
        return res.json({
          success: true,
          data: [],
          videos: [],
          message: 'Subjects are available but no teachers are assigned to them yet.'
        });
      }
      
      console.log(`📋 Showing videos from ${validTeacherIds.length} teachers for ${boardSubjects.length} board subjects`);
    }
    
    // Safe query logging (handle ObjectId serialization)
    try {
      const queryForLog = JSON.stringify(query, (key, value) => {
        if (value && typeof value === 'object' && value.toString) {
          return value.toString();
        }
        return value;
      }, 2);
      console.log('Video query:', queryForLog);
    } catch (logError) {
      console.log('Video query (could not stringify):', query);
    }
    
    // Get Super Admin exclusive content (videos) for this student's board
    let exclusiveVideos = [];
    if (student.board) {
      try {
        // Build query for exclusive content
        let exclusiveQuery = {
          board: student.board,
          type: 'video',
          isActive: true,
          isExclusive: true
        };
        
        // Add subject filter to exclusive content query if provided
        if (subject) {
          // Subject is stored as ObjectId reference in Content model
          if (mongoose.Types.ObjectId.isValid(subject)) {
            exclusiveQuery.subject = subject;
          }
        }
        
        const exclusiveContent = await Content.find(exclusiveQuery)
        .populate('subject', '_id name')
        .lean();

        console.log(`Found ${exclusiveContent.length} exclusive videos for board ${student.board}${subject ? ` with subject ${subject}` : ''}`);

        // Convert Content to video format
        exclusiveVideos = exclusiveContent.map(content => {
          const subjectId = content.subject 
            ? (content.subject._id?.toString() || content.subject.toString()) 
            : (content.subject?.toString() || '');
          
          console.log('📹 Exclusive video:', {
            title: content.title,
            subjectId,
            subjectObject: content.subject
          });
          
          return {
            _id: content._id.toString(),
            title: content.title,
            description: content.description || '',
            videoUrl: content.fileUrl,
            thumbnailUrl: content.thumbnailUrl || '',
            duration: (content.duration || 0) * 60, // Convert minutes to seconds
            subjectId: subjectId,
            subjectName: content.subject?.name || '',
            isYouTubeVideo: content.fileUrl?.includes('youtube.com') || content.fileUrl?.includes('youtu.be'),
            youtubeUrl: (content.fileUrl?.includes('youtube.com') || content.fileUrl?.includes('youtu.be')) ? content.fileUrl : undefined,
            isPublished: true,
            isActive: true,
            difficulty: 'Medium', // Default for exclusive content
            language: 'English',
            source: 'asli-prep-exclusive',
            createdAt: content.createdAt,
            topic: content.topic || ''
          };
        });
      } catch (exclusiveError) {
        console.error('Error fetching exclusive content:', exclusiveError);
        // Continue without exclusive videos if there's an error
      }
    }

    // Try to find videos - handle populate errors gracefully
    let videos = [];
    try {
      console.log('🔍 Querying teacher videos with query:', JSON.stringify(query, (key, value) => {
        if (value && typeof value === 'object' && value.toString) {
          return value.toString();
        }
        return value;
      }, 2));
      
      videos = await Video.find(query)
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 });
        
      console.log('✅ Found teacher videos:', videos.length);
      
      // Log video details for debugging
      if (videos.length > 0) {
        videos.forEach(video => {
          console.log('📹 Teacher video:', {
            title: video.title,
            subjectId: video.subjectId,
            subjectIdType: typeof video.subjectId,
            createdBy: video.createdBy?.toString() || video.createdBy,
            isPublished: video.isPublished,
            isActive: video.isActive
          });
        });
      } else {
        console.log('⚠️ No teacher videos found. Checking if videos exist without filters...');
        // Check if videos exist for these teachers at all
        const allTeacherVideos = await Video.find({ createdBy: { $in: teacherIds } }).limit(5);
        console.log(`Found ${allTeacherVideos.length} total videos for teachers:`, teacherIds);
        allTeacherVideos.forEach(v => {
          console.log('  -', v.title, 'subjectId:', v.subjectId, 'isPublished:', v.isPublished);
        });
      }
    } catch (populateError) {
      console.error('Error populating video createdBy:', populateError);
      console.error('Populate error stack:', populateError.stack);
      // Try without populate if populate fails
      try {
        videos = await Video.find(query).sort({ createdAt: -1 });
        console.log('✅ Found teacher videos (without populate):', videos.length);
      } catch (findError) {
        console.error('Error finding videos:', findError);
        console.error('Find error stack:', findError.stack);
        throw findError; // Re-throw to be caught by outer catch
      }
    }
    
    console.log('📊 Summary - Found teacher videos:', videos.length);
    console.log('📊 Summary - Found exclusive videos:', exclusiveVideos.length);

    // Format teacher videos to match expected structure
    const formattedTeacherVideos = videos.map(video => {
      // Handle subjectId - it's stored as a String in Video model
      const subjectIdStr = video.subjectId ? video.subjectId.toString() : '';
      
      console.log('📹 Formatting teacher video:', {
        title: video.title,
        rawSubjectId: video.subjectId,
        subjectIdStr,
        subjectIdType: typeof video.subjectId
      });
      
      return {
        _id: video._id.toString(),
        title: video.title || 'Untitled Video',
        description: video.description || '',
        videoUrl: video.videoUrl || '',
        thumbnailUrl: video.thumbnailUrl || '',
        duration: video.duration || 0,
        subjectId: subjectIdStr,
        subjectName: '', // Will be populated if subjectId is a reference, but Video model uses String
        isYouTubeVideo: video.isYouTubeVideo || false,
        youtubeUrl: video.youtubeUrl || '',
        isPublished: video.isPublished !== false,
        isActive: video.isActive !== false,
        difficulty: video.difficulty || 'Medium',
        language: video.language || 'English',
        source: 'teacher',
        createdAt: video.createdAt
      };
    });

    // Combine teacher videos and exclusive videos
    let allVideos = [...formattedTeacherVideos, ...exclusiveVideos];

    // Filter by subject if provided
    if (subject) {
      const subjectIdStr = subject.toString();
      console.log('🔍 Filtering videos by subject:', {
        requestedSubject: subject,
        requestedSubjectStr: subjectIdStr,
        totalVideosBeforeFilter: allVideos.length,
        teacherVideos: formattedTeacherVideos.length,
        exclusiveVideos: exclusiveVideos.length
      });
      
      // Log all video subjectIds before filtering for debugging
      console.log('📋 All videos before subject filter:');
      allVideos.forEach((v, idx) => {
        console.log(`  ${idx + 1}. "${v.title}" - subjectId: "${v.subjectId}" (type: ${typeof v.subjectId})`);
      });
      
      allVideos = allVideos.filter(v => {
        const vidSubjectId = v.subjectId?.toString() || v.subjectId || '';
        const vidSubjectIdStr = vidSubjectId.toString();
        
        // Try multiple comparison strategies
        const matches = vidSubjectId === subject || 
                       vidSubjectIdStr === subject || 
                       vidSubjectId === subjectIdStr ||
                       vidSubjectIdStr === subjectIdStr ||
                       vidSubjectId === subjectIdStr.toLowerCase() ||
                       vidSubjectIdStr === subjectIdStr.toLowerCase();
        
        if (matches) {
          console.log('✅ Video matches subject filter:', {
            videoTitle: v.title,
            videoSubjectId: vidSubjectId,
            requestedSubject: subject,
            requestedSubjectStr: subjectIdStr,
            source: v.source || 'unknown'
          });
        } else {
          console.log('❌ Video does NOT match subject filter:', {
            videoTitle: v.title,
            videoSubjectId: vidSubjectId,
            requestedSubject: subject,
            requestedSubjectStr: subjectIdStr,
            comparison: {
              exact: vidSubjectId === subject,
              stringMatch: vidSubjectIdStr === subject,
              strExact: vidSubjectId === subjectIdStr,
              strStringMatch: vidSubjectIdStr === subjectIdStr
            }
          });
        }
        
        return matches;
      });
      
      console.log(`📊 Filtered videos: ${allVideos.length} videos match subject ${subject}`);
      if (allVideos.length === 0 && formattedTeacherVideos.length > 0) {
        console.log('⚠️ WARNING: Subject filter removed all teacher videos!');
        console.log('This might indicate a subjectId mismatch. Check the video subjectId format vs requested subject format.');
      }
    }

    // Sort by creation date (newest first)
    allVideos.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    console.log(`Returning ${allVideos.length} total videos (${formattedTeacherVideos.length} from teacher, ${exclusiveVideos.length} exclusive)`);
    
    res.json({
      success: true,
      data: allVideos,
      videos: allVideos
    });
  } catch (error) {
    console.error('Error fetching student videos:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch videos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get student's assessments - filtered by assigned subjects and teachers teaching those subjects
router.get('/assessments', async (req, res) => {
  try {
    const { subject } = req.query;
    
    // Check if userId is set
    if (!req.userId) {
      console.error('req.userId is not set in assessments endpoint');
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated',
        data: [],
        assessments: [],
        quizzes: []
      });
    }
    
    // Get student to find their board (from assigned admin)
    const student = await User.findById(req.userId)
      .populate('assignedAdmin', 'board');
    
    console.log('Student assessments request - Student:', {
      id: student?._id,
      board: student?.board || (student?.assignedAdmin?.board),
      email: student?.email,
      role: student?.role
    });
    
    if (!student) {
      console.log('Student not found');
      return res.json({
        success: true,
        data: [],
        assessments: [],
        quizzes: []
      });
    }
    
    // Get student's board to find subjects
    const studentBoard = student.board || (student.assignedAdmin?.board);
    
    if (!studentBoard) {
      return res.json({
        success: true,
        data: [],
        assessments: [],
        quizzes: [],
        message: 'No board assigned. Please contact your admin.'
      });
    }
    
    // Get all subjects for student's board (same subjects admin sees in Subject Management)
    const Subject = (await import('../models/Subject.js')).default;
    const boardSubjects = await Subject.find({ 
      board: studentBoard, 
      isActive: true 
    }).sort({ name: 1 });
    
    if (boardSubjects.length === 0) {
      console.log('No subjects found for board:', studentBoard);
      return res.json({
        success: true,
        data: [],
        assessments: [],
        quizzes: [],
        message: 'No subjects available for your board.'
      });
    }
    
    const boardSubjectIds = boardSubjects.map(s => s._id?.toString() || s._id.toString());
    
    // Find teachers assigned to the same admin who teach any of these board subjects
    const teachers = await Teacher.find({
      adminId: student.assignedAdmin,
      subjects: { $in: boardSubjects.map(s => s._id) },
      isActive: true
    }).select('_id subjects').lean();
    
    const teacherIds = teachers.map(t => t._id);
    
    // Build a map of which teacher teaches which subject
    const teacherSubjectMap = new Map();
    teachers.forEach(teacher => {
      if (teacher.subjects && Array.isArray(teacher.subjects)) {
        teacher.subjects.forEach(subjId => {
          const subjIdStr = subjId.toString();
          if (boardSubjectIds.includes(subjIdStr)) {
            if (!teacherSubjectMap.has(subjIdStr)) {
              teacherSubjectMap.set(subjIdStr, []);
            }
            teacherSubjectMap.get(subjIdStr).push(teacher._id.toString());
          }
        });
      }
    });
    
    console.log(`Found ${teachers.length} teachers teaching ${boardSubjects.length} board subjects`);
    
    // Build query - show assessments from teachers teaching board subjects
    let query = { 
      isPublished: true,
      createdBy: { $in: teacherIds }
    };
    
    // Add subject filter if provided
    if (subject) {
      // Validate subject belongs to student's board
      const subjectObj = boardSubjects.find(s => 
        (s._id?.toString() === subject.toString()) || 
        (s._id.toString() === subject.toString())
      );
      
      if (!subjectObj) {
        return res.json({
          success: true,
          data: [],
          assessments: [],
          quizzes: [],
          message: 'This subject is not available for your board.'
        });
      }
      
      // Get teachers specifically assigned to this subject
      const subjectTeachers = teacherSubjectMap.get(subject.toString()) || [];
      if (subjectTeachers.length === 0) {
        console.log(`No teachers assigned to subject ${subject}`);
        return res.json({
          success: true,
          data: [],
          assessments: [],
          quizzes: [],
          message: 'No teacher assigned to this subject yet.'
        });
      }
      
      try {
        const subjectDoc = await Subject.findById(subject);
        const subjectName = subjectDoc ? subjectDoc.name : null;
        const subjectIdStr = subject.toString();
        
        console.log('Subject lookup:', { subject, subjectName, subjectIdStr });
        
        // Try ObjectId conversion if valid
        let subjectObjectId = null;
        if (mongoose.Types.ObjectId.isValid(subject)) {
          try {
            subjectObjectId = new mongoose.Types.ObjectId(subject);
          } catch (e) {
            // ignore
          }
        }
        
        // Build subject matching conditions
        const subjectConditions = [];
        
        // Try multiple matching strategies
        subjectConditions.push({ subjectIds: { $in: [subject] } });
        subjectConditions.push({ subjectIds: { $in: [subjectIdStr] } });
        
        if (subjectObjectId) {
          subjectConditions.push({ subjectIds: { $in: [subjectObjectId] } });
        }
        
        if (subjectName) {
          subjectConditions.push({ subjectIds: { $in: [subjectName] } });
        }
        
        // Apply subject filter to query - only from teachers assigned to this subject
        query = {
          $and: [
            { isPublished: true },
            { createdBy: { $in: subjectTeachers } },
            { $or: subjectConditions }
          ]
        };
      } catch (err) {
        console.error('Error in subject filter:', err);
        // Fallback - filter by board subjects
        const subjectConditions = boardSubjectIds.map(subjId => ({
          subjectIds: { $in: [subjId, subjId.toString()] }
        }));
        
        query = {
          $and: [
            { isPublished: true },
            { createdBy: { $in: teacherIds } },
            { $or: subjectConditions }
          ]
        };
      }
    } else {
      // No subject filter - show assessments from board subjects only
      // Only show content for subjects that have assigned teachers
      const subjectConditions = [];
      const validTeacherIds = [];
      
      boardSubjects.forEach(subj => {
        const subjIdStr = subj._id?.toString() || subj._id.toString();
        const teachersForSubject = teacherSubjectMap.get(subjIdStr);
        
        if (teachersForSubject && teachersForSubject.length > 0) {
          // This subject has assigned teachers, include it
          subjectConditions.push({
            subjectIds: { $in: [subjIdStr, subj._id.toString()] }
          });
          validTeacherIds.push(...teachersForSubject);
        }
      });
      
      if (subjectConditions.length > 0 && validTeacherIds.length > 0) {
        query = {
          $and: [
            { isPublished: true },
            { createdBy: { $in: [...new Set(validTeacherIds)] } },
            { $or: subjectConditions }
          ]
        };
      } else {
        // No content available - subjects exist but no teachers assigned
        return res.json({
          success: true,
          data: [],
          assessments: [],
          quizzes: [],
          message: 'Subjects are available but no teachers are assigned to them yet.'
        });
      }
    }
    
    // Try to find assessments - handle populate errors gracefully
    let assessments = [];
    try {
      assessments = await Assessment.find(query)
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 });
    } catch (populateError) {
      console.error('Error populating assessment createdBy:', populateError);
      // Try without populate if populate fails
      assessments = await Assessment.find(query).sort({ createdAt: -1 });
    }
    
    console.log('Found assessments after filter:', assessments.length);
    
    // If subject filter applied but no results, try without subject filter (for debugging)
    if (subject && assessments.length === 0 && allAssessments.length > 0) {
      console.log('WARNING: Subject filter returned 0 results but assessments exist');
      console.log('Returning all assessments without subject filter for debugging');
      
      assessments = await Assessment.find({
        isPublished: true,
        createdBy: teacherId
      })
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
      console.log('All assessments (no subject filter):', assessments.length);
    }
    
    if (assessments.length > 0) {
      console.log('Sample assessment:', {
        title: assessments[0].title,
        subjectIds: assessments[0].subjectIds,
        subjectIdsType: Array.isArray(assessments[0].subjectIds) ? 'array' : typeof assessments[0].subjectIds,
        subjectIdsValues: Array.isArray(assessments[0].subjectIds) ? assessments[0].subjectIds.map((id) => id?.toString()) : assessments[0].subjectIds?.toString()
      });
    }
    
    res.json({
      success: true,
      data: assessments,
      assessments: assessments,
      quizzes: assessments
    });
  } catch (error) {
    console.error('Error fetching student assessments:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch assessments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get student's exams (filtered by board - Super Admin created only)
router.get('/exams', async (req, res) => {
  try {
    const student = await User.findById(req.userId);
    if (!student || !student.board) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get exams created by Super Admin for student's board
    const exams = await Exam.find({ 
      board: student.board,
      createdByRole: 'super-admin',
      isActive: true 
    })
    .populate('createdBy', 'fullName email')
    .populate('questions')
    .sort({ createdAt: -1 });
    
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
router.get('/exams/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    const student = await User.findById(req.userId);
    if (!student || !student.board) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student board not assigned' 
      });
    }
    
    const exam = await Exam.findOne({ 
      _id: examId,
      board: student.board,
      createdByRole: 'super-admin',
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

// Get Asli Prep Exclusive Content (filtered by board)
router.get('/asli-prep-content', async (req, res) => {
  try {
    const { subject, type, topic } = req.query;
    
    console.log('📚 Fetching Asli Prep content for student:', req.userId);
    console.log('Query params:', { subject, type, topic });
    
    const student = await User.findById(req.userId);
    
    if (!student) {
      console.log('❌ Student not found');
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Get student's board - either directly assigned or inherited from admin
    let studentBoard = student.board;
    
    // If student doesn't have board, inherit from assigned admin
    if (!studentBoard && student.assignedAdmin) {
      const admin = await User.findById(student.assignedAdmin).select('board');
      if (admin && admin.board) {
        studentBoard = admin.board;
        console.log(`📋 Student board inherited from admin: ${studentBoard}`);
        
        // Update student's board for future queries
        await User.findByIdAndUpdate(student._id, { board: studentBoard }, { runValidators: false });
        console.log(`✅ Updated student's board to ${studentBoard}`);
      }
    }
    
    if (!studentBoard) {
      console.log('❌ Student does not have board assigned and no admin board found:', student.email);
      return res.json({
        success: true,
        data: []
      });
    }

    // Ensure board is uppercase to match Content model
    studentBoard = studentBoard.toUpperCase();
    console.log('🔍 Final student board:', studentBoard);

    // Build query
    const query = {
      board: studentBoard,
      isActive: true,
      isExclusive: true
    };

    if (subject && subject !== 'all') {
      // Validate ObjectId format
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

    console.log(`✅ Found ${contents.length} contents for board ${studentBoard}`);

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('❌ Error fetching Asli Prep content:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch content', error: error.message });
  }
});

// Get student's exam results
router.get('/exam-results', async (req, res) => {
  try {
    console.log('📋 Fetching exam results for student:', req.userId);
    
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const ExamResult = (await import('../models/ExamResult.js')).default;
    const results = await ExamResult.find({ userId: req.userId })
      .populate('examId', '_id title examType duration totalQuestions totalMarks')
      .sort({ completedAt: -1 });
    
    console.log(`✅ Found ${results.length} exam results for student`);
    
    // Log first result structure for debugging
    if (results.length > 0) {
      console.log('📋 Sample result structure:', {
        examId: results[0].examId,
        examIdType: typeof results[0].examId,
        examIdId: results[0].examId?._id?.toString(),
        examIdString: results[0].examId?.toString(),
        userId: results[0].userId?.toString()
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('❌ Error fetching exam results:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch exam results',
      error: error.message 
    });
  }
});

// Student Ranking Routes
router.get('/rankings', getAllStudentRankings);
router.get('/exams/:examId/ranking', getStudentExamRanking);

// Get student's subjects (from assigned admin's subjects)
router.get('/subjects', async (req, res) => {
  try {
    // Get student with assigned admin
    const student = await User.findById(req.userId)
      .populate('assignedAdmin', 'board')
      .select('-password');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (!student.assignedAdmin) {
      return res.json({
        success: true,
        subjects: [],
        data: [],
        message: 'No admin assigned. Please contact your administrator.'
      });
    }
    
    // Get admin's board to filter subjects (same as admin's Subject Management)
    const admin = await User.findById(student.assignedAdmin);
    if (!admin) {
      console.error('Admin not found for student:', student.email);
      return res.json({
        success: true,
        subjects: [],
        data: [],
        message: 'Admin not found. Please contact your administrator.'
      });
    }
    
    const adminBoard = admin.board || student.board;
    
    if (!adminBoard) {
      console.error('No board assigned to admin:', admin.email);
      return res.json({
        success: true,
        subjects: [],
        data: [],
        message: 'No board assigned to admin. Please contact your administrator.'
      });
    }
    
    // Get all subjects for the admin's board (exactly what admin sees in Subject Management)
    const Subject = (await import('../models/Subject.js')).default;
    const subjects = await Subject.find({ 
      board: adminBoard, 
      isActive: true 
    })
    .sort({ name: 1 });
    
    // Get teachers assigned to this admin who teach these subjects
    const Teacher = (await import('../models/Teacher.js')).default;
    const teachers = await Teacher.find({
      adminId: student.assignedAdmin,
      subjects: { $in: subjects.map(s => s._id) },
      isActive: true
    })
    .select('_id subjects fullName email phone department qualifications')
    .lean();
    
    console.log(`Found ${teachers.length} teachers teaching subjects for admin ${student.assignedAdmin}`);
    
    // Build map of subject to teachers
    const subjectTeachersMap = new Map();
    teachers.forEach(teacher => {
      if (teacher.subjects && Array.isArray(teacher.subjects)) {
        teacher.subjects.forEach((subjId) => {
          const subjIdStr = subjId.toString();
          if (!subjectTeachersMap.has(subjIdStr)) {
            subjectTeachersMap.set(subjIdStr, []);
          }
          subjectTeachersMap.get(subjIdStr).push({
            _id: teacher._id,
            name: teacher.fullName || 'Unknown Teacher',
            email: teacher.email || '',
            phone: teacher.phone || '',
            department: teacher.department || '',
            qualifications: teacher.qualifications || ''
          });
        });
      }
    });
    
    console.log('Subject-Teacher mapping:', Array.from(subjectTeachersMap.entries()).map(([subjId, teachers]) => ({
      subjectId: subjId,
      teachers: teachers.map((t) => t.name)
    })));
    
    // Format subjects with teacher information
    const formattedSubjects = subjects.map(subject => {
      const subjectIdStr = subject._id.toString();
      const assignedTeachers = subjectTeachersMap.get(subjectIdStr) || [];
      
      console.log(`Subject "${subject.name}" (${subjectIdStr}) has ${assignedTeachers.length} teachers:`, 
        assignedTeachers.map(t => t.name));
      
      return {
        _id: subject._id,
        id: subject._id.toString(),
        name: subject.name,
        description: subject.description || '',
        board: subject.board,
        code: subject.code || '',
        teachers: assignedTeachers,
        teacherCount: assignedTeachers.length
      };
    });
    
    console.log(`✅ Returning ${formattedSubjects.length} subjects with teacher info`);
    console.log('Sample subject with teachers:', formattedSubjects[0] ? {
      name: formattedSubjects[0].name,
      teacherCount: formattedSubjects[0].teacherCount,
      teachers: formattedSubjects[0].teachers
    } : 'none');
    
    res.json({
      success: true,
      subjects: formattedSubjects,
      data: formattedSubjects
    });
  } catch (error) {
    console.error('Error fetching student subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
  }
});

export default router;
