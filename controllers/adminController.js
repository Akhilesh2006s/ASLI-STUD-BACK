import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Video from '../models/Video.js';
import Assessment from '../models/Assessment.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';

// Admin Dashboard Stats
export const getAdminDashboardStats = async (req, res) => {
  try {
    const adminId = req.adminId;
    
    // Build filter based on user role
    const filter = adminId ? { adminId } : {};
    const userFilter = adminId ? { assignedAdmin: adminId } : {};
    
    const [
      totalStudents,
      totalTeachers,
      totalVideos,
      totalAssessments,
      totalExams,
      activeUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'student', ...userFilter }),
      Teacher.countDocuments(filter),
      Video.countDocuments(filter),
      Assessment.countDocuments(filter),
      Exam.countDocuments(filter),
      User.countDocuments({ 
        role: 'student', 
        isActive: true, 
        ...userFilter 
      })
    ]);
    
    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalVideos,
        totalAssessments,
        totalExams,
        activeUsers,
        totalClasses: Math.ceil(totalStudents / 30) // Assuming 30 students per class
      }
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// Student Management
export const getStudents = async (req, res) => {
  try {
    const adminId = req.adminId;
    const filter = adminId ? { assignedAdmin: adminId } : {};
    
    const students = await User.find({ 
      role: 'student', 
      ...filter 
    }).select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { email, password, fullName, classNumber, phone } = req.body;
    const adminId = req.adminId;
    
    // Check if student already exists
    const existingStudent = await User.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student with this email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'Password123', 12);
    
    // Create new student
    const newStudent = new User({
      email,
      password: hashedPassword,
      fullName,
      classNumber: classNumber || 'Unassigned',
      phone: phone || '',
      role: 'student',
      isActive: true,
      assignedAdmin: adminId
    });
    
    await newStudent.save();
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        id: newStudent._id,
        email: newStudent.email,
        fullName: newStudent.fullName,
        classNumber: newStudent.classNumber,
        phone: newStudent.phone,
        isActive: newStudent.isActive
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ success: false, message: 'Failed to create student' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, classNumber, phone, isActive } = req.body;
    const adminId = req.adminId;
    
    // Build update filter
    const filter = { _id: id, role: 'student' };
    if (adminId) {
      filter.assignedAdmin = adminId;
    }
    
    const updatedStudent = await User.findOneAndUpdate(
      filter,
      { fullName, classNumber, phone, isActive },
      { new: true }
    ).select('-password');
    
    if (!updatedStudent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Failed to update student' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.adminId;
    
    // Build delete filter
    const filter = { _id: id, role: 'student' };
    if (adminId) {
      filter.assignedAdmin = adminId;
    }
    
    const deletedStudent = await User.findOneAndDelete(filter);
    
    if (!deletedStudent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete student' });
  }
};

// Teacher Management
export const getTeachers = async (req, res) => {
  try {
    const adminId = req.adminId;
    const filter = adminId ? { adminId } : {};
    
    const teachers = await Teacher.find(filter)
      .populate('subjects', 'name description')
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Transform the data to match frontend expectations
    const transformedTeachers = teachers.map(teacher => ({
      _id: teacher._id,
      id: teacher._id,
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department,
      qualifications: teacher.qualifications,
      subjects: teacher.subjects || [],
      role: teacher.role,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt
    }));
    
    res.json(transformedTeachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
};

export const createTeacher = async (req, res) => {
  try {
    const { email, password, fullName, phone, department, qualifications, subjects } = req.body;
    const adminId = req.adminId;
    
    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ 
        success: false, 
        message: 'Teacher with this email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'Password123', 12);
    
    // Create new teacher
    const newTeacher = new Teacher({
      email,
      password: hashedPassword,
      fullName,
      phone: phone || '',
      department: department || '',
      qualifications: qualifications || '',
      subjects: subjects || [],
      role: 'teacher',
      isActive: true,
      adminId
    });
    
    await newTeacher.save();
    
    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        id: newTeacher._id,
        email: newTeacher.email,
        fullName: newTeacher.fullName,
        phone: newTeacher.phone,
        department: newTeacher.department,
        qualifications: newTeacher.qualifications,
        subjects: newTeacher.subjects,
        isActive: newTeacher.isActive
      }
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ success: false, message: 'Failed to create teacher' });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, department, qualifications, subjects, isActive } = req.body;
    const adminId = req.adminId;
    
    // Build update filter
    const filter = { _id: id };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const updatedTeacher = await Teacher.findOneAndUpdate(
      filter,
      { fullName, phone, department, qualifications, subjects, isActive },
      { new: true }
    ).select('-password');
    
    if (!updatedTeacher) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedTeacher
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ success: false, message: 'Failed to update teacher' });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.adminId;
    
    // Build delete filter
    const filter = { _id: id };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const deletedTeacher = await Teacher.findOneAndDelete(filter);
    
    if (!deletedTeacher) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete teacher' });
  }
};

// Video/Course Management
export const getVideos = async (req, res) => {
  try {
    const adminId = req.adminId;
    const filter = adminId ? { adminId } : {};
    
    const videos = await Video.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
};

export const createVideo = async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, duration, subjectId, difficulty, youtubeUrl } = req.body;
    const adminId = req.adminId;
    
    const newVideo = new Video({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      subjectId,
      difficulty: difficulty || 'beginner',
      youtubeUrl,
      isYouTubeVideo: !!youtubeUrl,
      isPublished: true,
      adminId
    });
    
    await newVideo.save();
    
    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: newVideo
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ success: false, message: 'Failed to create video' });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.adminId;
    
    // Build update filter
    const filter = { _id: id };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const updatedVideo = await Video.findOneAndUpdate(
      filter,
      updateData,
      { new: true }
    );
    
    if (!updatedVideo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Video updated successfully',
      data: updatedVideo
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ success: false, message: 'Failed to update video' });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.adminId;
    
    // Build delete filter
    const filter = { _id: id };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const deletedVideo = await Video.findOneAndDelete(filter);
    
    if (!deletedVideo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete video' });
  }
};

// Assessment Management
export const getAssessments = async (req, res) => {
  try {
    const adminId = req.adminId;
    const filter = adminId ? { adminId } : {};
    
    const assessments = await Assessment.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assessments' });
  }
};

export const createAssessment = async (req, res) => {
  try {
    const { title, description, questions, subjectIds, difficulty, duration, driveLink } = req.body;
    const adminId = req.adminId;
    
    // Calculate total points
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    const newAssessment = new Assessment({
      title,
      description,
      questions,
      subjectIds,
      difficulty: difficulty || 'beginner',
      duration,
      totalPoints,
      driveLink,
      isDriveQuiz: !!driveLink,
      isPublished: true,
      adminId
    });
    
    await newAssessment.save();
    
    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: newAssessment
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create assessment' });
  }
};

export const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.adminId;
    
    // Recalculate total points if questions are updated
    if (updateData.questions) {
      updateData.totalPoints = updateData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    }
    
    // Build update filter
    const filter = { _id: id };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const updatedAssessment = await Assessment.findOneAndUpdate(
      filter,
      updateData,
      { new: true }
    );
    
    if (!updatedAssessment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assessment not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: updatedAssessment
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update assessment' });
  }
};

export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.adminId;
    
    // Build delete filter
    const filter = { _id: id };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const deletedAssessment = await Assessment.findOneAndDelete(filter);
    
    if (!deletedAssessment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assessment not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete assessment' });
  }
};

// Analytics
export const getAnalytics = async (req, res) => {
  try {
    const adminId = req.adminId;
    
    // Build filters based on user role
    const videoFilter = adminId ? { adminId } : {};
    const assessmentFilter = adminId ? { adminId } : {};
    const userFilter = adminId ? { assignedAdmin: adminId } : {};
    const teacherFilter = adminId ? { adminId } : {};
    
    const [
      totalVideos,
      totalAssessments,
      totalStudents,
      totalTeachers,
      activeStudents,
      recentVideos,
      recentAssessments
    ] = await Promise.all([
      Video.countDocuments(videoFilter),
      Assessment.countDocuments(assessmentFilter),
      User.countDocuments({ role: 'student', ...userFilter }),
      Teacher.countDocuments(teacherFilter),
      User.countDocuments({ 
        role: 'student', 
        isActive: true, 
        ...userFilter 
      }),
      Video.find(videoFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt views'),
      Assessment.find(assessmentFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt totalPoints')
    ]);
    
    // Calculate engagement metrics
    const totalViews = await Video.aggregate([
      { $match: videoFilter },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    
    const avgViews = totalViews.length > 0 ? totalViews[0].totalViews / totalVideos : 0;
    
    res.json({
      success: true,
      data: {
        overview: {
          totalVideos,
          totalAssessments,
          totalStudents,
          totalTeachers,
          activeStudents,
          avgViews: Math.round(avgViews)
        },
        recentActivity: {
          videos: recentVideos,
          assessments: recentAssessments
        },
        engagement: {
          studentEngagement: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0,
          contentEngagement: avgViews > 0 ? Math.round(Math.min(avgViews / 100, 100)) : 0
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

// Exam Management
export const getExams = async (req, res) => {
  try {
    const adminId = req.adminId;
    const filter = adminId ? { adminId } : {};
    
    const exams = await Exam.find(filter)
      .populate('createdBy', 'fullName')
      .populate('questions')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
};

export const createExam = async (req, res) => {
  try {
    const { title, description, examType, duration, totalQuestions, totalMarks, instructions, startDate, endDate } = req.body;
    const adminId = req.adminId;
    
    const newExam = new Exam({
      title,
      description,
      examType: examType || 'weekend',
      duration,
      totalQuestions,
      totalMarks,
      instructions,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
      createdBy: req.userId,
      adminId
    });
    
    await newExam.save();
    
    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: newExam
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ success: false, message: 'Failed to create exam' });
  }
};

export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.adminId;
    
    // Convert date strings to Date objects if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    
    // Build update filter
    const filter = { _id: id };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const updatedExam = await Exam.findOneAndUpdate(
      filter,
      updateData,
      { new: true }
    ).populate('questions');
    
    if (!updatedExam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: updatedExam
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ success: false, message: 'Failed to update exam' });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.adminId;
    
    // Build delete filter
    const filter = { _id: id };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const deletedExam = await Exam.findOneAndDelete(filter);
    
    if (!deletedExam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found or access denied' 
      });
    }
    
    // Also delete associated questions
    await Question.deleteMany({ exam: id, adminId });
    
    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete exam' });
  }
};

// Question Management
export const getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    const adminId = req.adminId;
    
    // Build filter
    const filter = { exam: examId };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const questions = await Question.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Get exam questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionText, questionImage, questionType, options, correctAnswer, marks, negativeMarks, explanation, subject } = req.body;
    const adminId = req.adminId;
    
    const newQuestion = new Question({
      questionText,
      questionImage,
      questionType,
      options,
      correctAnswer,
      marks: marks || 1,
      negativeMarks: negativeMarks || 0,
      explanation,
      subject: subject || 'maths',
      exam: examId,
      createdBy: req.userId,
      adminId,
      isActive: true
    });
    
    await newQuestion.save();
    
    // Add question to exam and update totalQuestions count
    await Exam.findByIdAndUpdate(examId, { 
      $push: { questions: newQuestion._id },
      $inc: { totalQuestions: 1 }
    });
    
    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: newQuestion
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ success: false, message: 'Failed to create question' });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const updateData = req.body;
    const adminId = req.adminId;
    
    // Build update filter
    const filter = { _id: questionId };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const updatedQuestion = await Question.findOneAndUpdate(
      filter,
      updateData,
      { new: true }
    );
    
    if (!updatedQuestion) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ success: false, message: 'Failed to update question' });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const adminId = req.adminId;
    
    // Build delete filter
    const filter = { _id: questionId };
    if (adminId) {
      filter.adminId = adminId;
    }
    
    const deletedQuestion = await Question.findOneAndDelete(filter);
    
    if (!deletedQuestion) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found or access denied' 
      });
    }
    
    // Remove question from exam and decrement totalQuestions count
    await Exam.findByIdAndUpdate(deletedQuestion.exam, { 
      $pull: { questions: questionId },
      $inc: { totalQuestions: -1 }
    });
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete question' });
  }
};

// Teacher Dashboard Stats
export const getTeacherDashboardStats = async (req, res) => {
  try {
    const teacherId = req.teacherId;
    
    // Get teacher's assigned classes
    const teacher = await Teacher.findById(teacherId).populate('subjects');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Get students assigned to this teacher's classes
    const students = await User.find({ 
      role: 'student',
      assignedTeacher: teacherId 
    });

    // Get teacher's videos and assessments
    const [videos, assessments] = await Promise.all([
      Video.find({ createdBy: teacherId }),
      Assessment.find({ createdBy: teacherId })
    ]);

    // Calculate average performance
    const examResults = await ExamResult.find({ 
      studentId: { $in: students.map(s => s._id) }
    });
    
    const averagePerformance = examResults.length > 0 
      ? examResults.reduce((sum, result) => sum + result.score, 0) / examResults.length 
      : 0;

    // Get recent activity
    const recentActivity = [
      {
        action: 'New video uploaded',
        time: '2 hours ago',
        type: 'video'
      },
      {
        action: 'Assessment created',
        time: '4 hours ago',
        type: 'assessment'
      },
      {
        action: 'Student completed exam',
        time: '6 hours ago',
        type: 'exam'
      }
    ];

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents: students.length,
          totalClasses: teacher.subjects?.length || 0,
          totalVideos: videos.length,
          totalAssessments: assessments.length,
          averagePerformance: Math.round(averagePerformance)
        },
        students: students.map(student => ({
          id: student._id,
          name: student.fullName,
          email: student.email,
          classNumber: student.classNumber,
          performance: Math.floor(Math.random() * 40) + 60, // Mock data
          lastExamScore: Math.floor(Math.random() * 40) + 60,
          totalExams: Math.floor(Math.random() * 10) + 1
        })),
        videos: videos.map(video => ({
          id: video._id,
          title: video.title,
          subject: video.subject,
          duration: video.duration,
          views: Math.floor(Math.random() * 1000) + 100,
          createdAt: video.createdAt
        })),
        assessments: assessments.map(assessment => ({
          id: assessment._id,
          title: assessment.title,
          subject: assessment.subject,
          questions: assessment.questions?.length || 0,
          attempts: Math.floor(Math.random() * 50) + 10,
          averageScore: Math.floor(Math.random() * 30) + 70,
          createdAt: assessment.createdAt
        })),
        recentActivity
      }
    });
  } catch (error) {
    console.error('Teacher dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teacher dashboard stats' });
  }
};

// Assign classes to teacher
export const assignClasses = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { classIds } = req.body;
    const adminId = req.adminId;

    console.log('Assign classes request:', { teacherId, classIds, adminId });

    if (!teacherId || !classIds || !Array.isArray(classIds)) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID and class IDs array are required'
      });
    }

    // Find the teacher
    const teacher = await Teacher.findOne({ 
      _id: teacherId,
      ...(adminId ? { adminId } : {})
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update teacher with new class IDs
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { 
        assignedClassIds: classIds,
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log('Updated teacher classes:', updatedTeacher);

    res.json({
      success: true,
      message: 'Classes assigned successfully',
      data: updatedTeacher
    });
  } catch (error) {
    console.error('Assign classes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign classes' 
    });
  }
};
  try {
    const { teacherId } = req.params;
    const { subjectIds } = req.body;
    const adminId = req.adminId;

    console.log('Assign subjects request:', { teacherId, subjectIds, adminId });

    if (!teacherId || !subjectIds || !Array.isArray(subjectIds)) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID and subject IDs array are required'
      });
    }

    // Find the teacher
    const teacher = await Teacher.findOne({ 
      _id: teacherId,
      ...(adminId ? { adminId } : {})
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update teacher with new subjects
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { 
        subjects: subjectIds,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('subjects');

    console.log('Updated teacher:', updatedTeacher);

    res.json({
      success: true,
      message: 'Subjects assigned successfully',
      data: updatedTeacher
    });
  } catch (error) {
    console.error('Assign subjects error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign subjects' 
    });
  }
};