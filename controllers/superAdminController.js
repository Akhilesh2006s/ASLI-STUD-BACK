import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Teacher from '../models/Teacher.js';
import Assessment from '../models/Assessment.js';
import Exam from '../models/Exam.js';
import ExamResult from '../models/ExamResult.js';

// Super Admin Login
export const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check super admin credentials
    if (email === 'Amenity@gmail.com' && password === 'Amenity') {
      const token = jwt.sign(
        { 
          id: 'super-admin-001',
          email: email,
          fullName: 'Super Admin',
          role: 'super-admin'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        user: {
          id: 'super-admin-001',
          email: email,
          fullName: 'Super Admin',
          role: 'super-admin'
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Dashboard Stats (Global view for Super Admin)
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalVideos = await Video.countDocuments();
    const totalAssessments = await Assessment.countDocuments();
    const totalExams = await Exam.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    // Calculate meaningful metrics instead of mock revenue
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalExamResults = await ExamResult.countDocuments();
    const activeVideos = await Video.countDocuments({ isActive: true });
    const activeAssessments = await Assessment.countDocuments({ isActive: true });
    
    // Calculate engagement metrics
    const avgExamsPerStudent = totalStudents > 0 ? (totalExamResults / totalStudents).toFixed(1) : 0;
    const contentEngagement = totalVideos + totalAssessments + totalExams;
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        courses: totalVideos,
        assessments: totalAssessments,
        exams: totalExams,
        examResults: totalExamResults,
        activeVideos,
        activeAssessments,
        avgExamsPerStudent,
        contentEngagement,
        superAdmins: 1
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// Get All Admins with comprehensive analytics
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    
    // Get comprehensive analytics for each admin
    const adminsWithAnalytics = await Promise.all(
      admins.map(async (admin) => {
        const [
          studentCount, 
          teacherCount, 
          videoCount, 
          assessmentCount, 
          examCount,
          examResults
        ] = await Promise.all([
          User.countDocuments({ role: 'student', assignedAdmin: admin._id }).catch(() => 0),
          Teacher.countDocuments({ adminId: admin._id }).catch(() => 0),
          Video.countDocuments({ adminId: admin._id }).catch(() => 0),
          Assessment.countDocuments({ adminId: admin._id }).catch(() => 0),
          Exam.countDocuments({ adminId: admin._id }).catch(() => 0),
          ExamResult.find({ adminId: admin._id }).populate('userId', 'fullName email').catch(() => [])
        ]);
        
        // Calculate exam performance analytics
        const totalExamsTaken = examResults.length;
        const totalQuestionsAnswered = examResults.reduce((sum, result) => sum + (result.totalQuestions || 0), 0);
        const totalCorrectAnswers = examResults.reduce((sum, result) => sum + (result.correctAnswers || 0), 0);
        const totalMarksObtained = examResults.reduce((sum, result) => sum + (result.obtainedMarks || 0), 0);
        const totalMarksPossible = examResults.reduce((sum, result) => sum + (result.totalMarks || 0), 0);
        
        const averageScore = totalMarksPossible > 0 ? (totalMarksObtained / totalMarksPossible * 100).toFixed(1) : 0;
        const averageAccuracy = totalQuestionsAnswered > 0 ? (totalCorrectAnswers / totalQuestionsAnswered * 100).toFixed(1) : 0;
        
        // Get top performing students
        const studentPerformance = examResults.reduce((acc, result) => {
          if (!result.userId || !result.userId._id) return acc;
          const studentId = result.userId._id.toString();
          if (!acc[studentId]) {
            acc[studentId] = {
              studentName: result.userId.fullName || 'Unknown',
              studentEmail: result.userId.email || 'unknown@email.com',
              totalExams: 0,
              totalMarks: 0,
              totalPossibleMarks: 0,
              averageScore: 0
            };
          }
          acc[studentId].totalExams += 1;
          acc[studentId].totalMarks += (result.obtainedMarks || 0);
          acc[studentId].totalPossibleMarks += (result.totalMarks || 0);
          return acc;
        }, {});
        
        // Calculate average scores for each student
        Object.values(studentPerformance).forEach(student => {
          student.averageScore = student.totalPossibleMarks > 0 
            ? (student.totalMarks / student.totalPossibleMarks * 100).toFixed(1)
            : 0;
        });
        
        // Sort students by performance
        const topStudents = Object.values(studentPerformance)
          .sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore))
          .slice(0, 5);
        
        // Get recent exam results
        const recentResults = examResults
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
          .slice(0, 10)
          .map(result => ({
            examTitle: result.examTitle || 'Unknown Exam',
            studentName: result.userId?.fullName || 'Unknown Student',
            score: result.percentage || 0,
            marks: `${result.obtainedMarks || 0}/${result.totalMarks || 0}`,
            completedAt: result.completedAt || new Date()
          }));
        
        // Calculate subject-wise performance
        const subjectPerformance = {};
        examResults.forEach(result => {
          if (result.subjectWiseScore) {
            Object.entries(result.subjectWiseScore).forEach(([subject, data]) => {
              if (!subjectPerformance[subject]) {
                subjectPerformance[subject] = {
                  totalQuestions: 0,
                  correctAnswers: 0,
                  totalMarks: 0,
                  obtainedMarks: 0
                };
              }
              subjectPerformance[subject].totalQuestions += data.total;
              subjectPerformance[subject].correctAnswers += data.correct;
              subjectPerformance[subject].totalMarks += data.marks;
              subjectPerformance[subject].obtainedMarks += data.marks;
            });
          }
        });
        
        // Calculate subject-wise averages
        const subjectAnalytics = Object.entries(subjectPerformance).map(([subject, data]) => ({
          subject,
          accuracy: data.totalQuestions > 0 ? (data.correctAnswers / data.totalQuestions * 100).toFixed(1) : 0,
          averageScore: data.totalMarks > 0 ? (data.obtainedMarks / data.totalMarks * 100).toFixed(1) : 0,
          totalQuestions: data.totalQuestions,
          correctAnswers: data.correctAnswers
        }));
        
        return {
          id: admin._id,
          name: admin.fullName,
          email: admin.email,
          permissions: admin.permissions || [],
          status: admin.isActive ? 'Active' : 'Inactive',
          joinDate: admin.createdAt,
          stats: {
            students: studentCount,
            teachers: teacherCount,
            videos: videoCount,
            assessments: assessmentCount,
            exams: examCount,
            totalExamsTaken: totalExamsTaken,
            averageScore: averageScore,
            averageAccuracy: averageAccuracy
          },
          analytics: {
            topStudents: topStudents,
            recentResults: recentResults,
            subjectPerformance: subjectAnalytics,
            totalQuestionsAnswered: totalQuestionsAnswered,
            totalCorrectAnswers: totalCorrectAnswers,
            totalMarksObtained: totalMarksObtained,
            totalMarksPossible: totalMarksPossible
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: adminsWithAnalytics
    });
  } catch (error) {
    console.error('Get admins analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin analytics' });
  }
};

// Get detailed analytics for a specific admin
export const getAdminAnalytics = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    // Verify admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    // Get all exam results for this admin
    const examResults = await ExamResult.find({ adminId })
      .populate('userId', 'fullName email')
      .populate('examId', 'title subject')
      .sort({ completedAt: -1 });
    
    // Get all students assigned to this admin
    const students = await User.find({ role: 'student', assignedAdmin: adminId })
      .select('fullName email createdAt');
    
    // Get all teachers for this admin
    const teachers = await Teacher.find({ adminId })
      .select('fullName email department subjects createdAt');
    
    // Calculate comprehensive analytics
    const totalExamsTaken = examResults.length;
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    
    // Performance metrics
    const totalQuestionsAnswered = examResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const totalCorrectAnswers = examResults.reduce((sum, result) => sum + result.correctAnswers, 0);
    const totalMarksObtained = examResults.reduce((sum, result) => sum + result.obtainedMarks, 0);
    const totalMarksPossible = examResults.reduce((sum, result) => sum + result.totalMarks, 0);
    
    const averageScore = totalMarksPossible > 0 ? (totalMarksObtained / totalMarksPossible * 100).toFixed(1) : 0;
    const averageAccuracy = totalQuestionsAnswered > 0 ? (totalCorrectAnswers / totalQuestionsAnswered * 100).toFixed(1) : 0;
    
    // Student performance analysis
    const studentPerformance = {};
    examResults.forEach(result => {
      const studentId = result.userId._id.toString();
      if (!studentPerformance[studentId]) {
        studentPerformance[studentId] = {
          studentName: result.userId.fullName,
          studentEmail: result.userId.email,
          totalExams: 0,
          totalMarks: 0,
          totalPossibleMarks: 0,
          examHistory: []
        };
      }
      studentPerformance[studentId].totalExams += 1;
      studentPerformance[studentId].totalMarks += result.obtainedMarks;
      studentPerformance[studentId].totalPossibleMarks += result.totalMarks;
      studentPerformance[studentId].examHistory.push({
        examTitle: result.examTitle,
        score: result.percentage,
        marks: `${result.obtainedMarks}/${result.totalMarks}`,
        completedAt: result.completedAt
      });
    });
    
    // Calculate average scores for each student
    Object.values(studentPerformance).forEach(student => {
      student.averageScore = student.totalPossibleMarks > 0 
        ? (student.totalMarks / student.totalPossibleMarks * 100).toFixed(1)
        : 0;
    });
    
    // Sort students by performance
    const topPerformers = Object.values(studentPerformance)
      .sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore))
      .slice(0, 10);
    
    // Subject-wise analysis
    const subjectAnalysis = {};
    examResults.forEach(result => {
      if (result.subjectWiseScore) {
        Object.entries(result.subjectWiseScore).forEach(([subject, data]) => {
          if (!subjectAnalysis[subject]) {
            subjectAnalysis[subject] = {
              totalQuestions: 0,
              correctAnswers: 0,
              totalMarks: 0,
              obtainedMarks: 0,
              examCount: 0
            };
          }
          subjectAnalysis[subject].totalQuestions += data.total;
          subjectAnalysis[subject].correctAnswers += data.correct;
          subjectAnalysis[subject].totalMarks += data.marks;
          subjectAnalysis[subject].obtainedMarks += data.marks;
          subjectAnalysis[subject].examCount += 1;
        });
      }
    });
    
    // Calculate subject-wise averages
    const subjectAnalytics = Object.entries(subjectAnalysis).map(([subject, data]) => ({
      subject,
      accuracy: data.totalQuestions > 0 ? (data.correctAnswers / data.totalQuestions * 100).toFixed(1) : 0,
      averageScore: data.totalMarks > 0 ? (data.obtainedMarks / data.totalMarks * 100).toFixed(1) : 0,
      totalQuestions: data.totalQuestions,
      correctAnswers: data.correctAnswers,
      examCount: data.examCount
    }));
    
    // Recent activity
    const recentActivity = examResults.slice(0, 20).map(result => ({
      type: 'exam_completed',
      studentName: result.userId.fullName,
      examTitle: result.examTitle,
      score: result.percentage,
      completedAt: result.completedAt
    }));
    
    res.json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.fullName,
          email: admin.email,
          joinDate: admin.createdAt
        },
        overview: {
          totalStudents,
          totalTeachers,
          totalExamsTaken,
          averageScore,
          averageAccuracy,
          totalQuestionsAnswered,
          totalCorrectAnswers,
          totalMarksObtained,
          totalMarksPossible
        },
        topPerformers,
        subjectAnalytics,
        recentActivity,
        allStudents: students,
        allTeachers: teachers
      }
    });
  } catch (error) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin analytics' });
  }
};

// Create New Admin
export const createAdmin = async (req, res) => {
  try {
    const { name, email, permissions } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }
    
    // Create new admin
    const hashedPassword = await bcrypt.hash('admin123', 10); // Default password
    const newAdmin = new User({
      fullName: name,
      email,
      password: hashedPassword,
      role: 'admin',
      permissions: permissions || [],
      isActive: true
    });
    
    await newAdmin.save();
    
    res.json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: newAdmin._id,
        name: newAdmin.fullName,
        email: newAdmin.email,
        permissions: newAdmin.permissions,
        status: 'Active',
        joinDate: newAdmin.createdAt
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
};

// Update Admin
export const updateAdmin = async (req, res) => {
  try {
    const { permissions, isActive } = req.body;
    const admin = await User.findByIdAndUpdate(
      req.params.id,
      { permissions, isActive },
      { new: true }
    );
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        id: admin._id,
        name: admin.fullName,
        email: admin.email,
        permissions: admin.permissions,
        status: admin.isActive ? 'Active' : 'Inactive'
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to update admin' });
  }
};

// Delete Admin
export const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    
    // Check if admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    // Delete admin and all their data
    await Promise.all([
      User.deleteMany({ assignedAdmin: adminId }),
      Teacher.deleteMany({ adminId }),
      Video.deleteMany({ adminId }),
      Assessment.deleteMany({ adminId }),
      User.findByIdAndDelete(adminId)
    ]);
    
    res.json({
      success: true,
      message: 'Admin and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
};

// Get All Users (Global view)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('assignedAdmin', 'fullName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Create New User (Global)
export const createUser = async (req, res) => {
  try {
    const { name, email, role, details, assignedAdmin } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash('password123', 10); // Default password
    const newUser = new User({
      fullName: name,
      email,
      password: hashedPassword,
      role: role,
      details: details,
      assignedAdmin: assignedAdmin || null,
      isActive: true
    });
    
    await newUser.save();
    
    res.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id,
        name: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        details: newUser.details,
        assignedAdmin: newUser.assignedAdmin,
        status: 'Active',
        joinDate: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

// Get All Teachers (Global view)
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate('subjects', 'name')
      .populate('adminId', 'fullName email')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
};

// Create New Teacher (Global)
export const createTeacher = async (req, res) => {
  try {
    const { email, password, fullName, phone, department, qualifications, subjects, adminId } = req.body;
    
    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ success: false, message: 'Teacher already exists' });
    }
    
    // Verify admin exists
    if (adminId) {
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(400).json({ success: false, message: 'Invalid admin ID' });
      }
    }
    
    // Create new teacher
    const hashedPassword = await bcrypt.hash(password || 'Password123', 12);
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
      adminId: adminId || null
    });
    
    await newTeacher.save();
    
    res.json({
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
        adminId: newTeacher.adminId,
        isActive: newTeacher.isActive
      }
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ success: false, message: 'Failed to create teacher' });
  }
};

// Get All Courses/Videos (Global view)
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Video.find()
      .populate('createdBy', 'fullName')
      .populate('adminId', 'fullName email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

// Create New Course (Global)
export const createCourse = async (req, res) => {
  try {
    const { title, subject, grade, board, teacherId, adminId } = req.body;
    
    // Find teacher
    let teacherQuery = { _id: teacherId };
    if (adminId) {
      teacherQuery.adminId = adminId;
    }
    const teacher = await Teacher.findOne(teacherQuery);
    
    if (!teacher) {
      return res.status(400).json({ success: false, message: 'Teacher not found' });
    }
    
    const newCourse = new Video({
      title: title,
      subject: subject,
      grade: grade,
      board: board,
      teacher: teacherId,
      createdBy: teacherId,
      description: `${subject} course for ${grade} - ${board}`,
      isPublished: true,
      adminId: adminId || teacher.adminId
    });
    
    await newCourse.save();
    
    res.json({
      success: true,
      message: 'Course created successfully',
      data: {
        id: newCourse._id,
        title: newCourse.title,
        subject: newCourse.subject,
        grade: newCourse.grade,
        board: newCourse.board,
        teacher: teacher.fullName,
        adminId: newCourse.adminId,
        status: 'Published',
        created: newCourse.createdAt
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: 'Failed to create course' });
  }
};

// Get Analytics (Global view)
export const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalVideos = await Video.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    // Calculate daily active users (mock data)
    const dailyActive = Math.floor(totalUsers * 0.1);
    const weeklyActive = Math.floor(totalUsers * 0.3);
    const monthlyActive = Math.floor(totalUsers * 0.7);
    
    res.json({
      success: true,
      data: {
        dailyActive,
        weeklyActive,
        monthlyActive,
        avgSessionTime: "24m 35s",
        completionRate: 76,
        revenueGrowth: 23.5,
        userGrowth: 18.2,
        courseEngagement: 89,
        totalUsers,
        totalTeachers,
        totalVideos,
        totalAdmins
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

// Get Subscriptions (Global view)
export const getSubscriptions = async (req, res) => {
  try {
    // Mock subscription data for now
    const subscriptions = [
      { id: 1, user: "Rahul Sharma", plan: "Premium", amount: 999, status: "Active", nextBilling: "2024-09-15", paymentMethod: "Credit Card" },
      { id: 2, user: "Amit Kumar", plan: "Basic", amount: 499, status: "Active", nextBilling: "2024-09-20", paymentMethod: "UPI" },
      { id: 3, user: "Kavya Reddy", plan: "Premium", amount: 999, status: "Cancelled", nextBilling: "-", paymentMethod: "Net Banking" },
      { id: 4, user: "Arjun Patel", plan: "Pro", amount: 1499, status: "Active", nextBilling: "2024-09-18", paymentMethod: "Debit Card" },
      { id: 5, user: "Sneha Jain", plan: "Basic", amount: 499, status: "Pending", nextBilling: "2024-09-12", paymentMethod: "UPI" }
    ];
    
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Subscriptions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
};

// Export Data (Global)
export const exportData = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('assignedAdmin', 'fullName email');
    const videos = await Video.find().populate('adminId', 'fullName email');
    const teachers = await Teacher.find().populate('adminId', 'fullName email');
    const assessments = await Assessment.find().populate('adminId', 'fullName email');
    
    const exportData = {
      users: users,
      videos: videos,
      teachers: teachers,
      assessments: assessments,
      exportDate: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
};


