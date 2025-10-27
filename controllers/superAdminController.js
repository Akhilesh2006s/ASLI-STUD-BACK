import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Teacher from '../models/Teacher.js';
import Assessment from '../models/Assessment.js';
import Exam from '../models/Exam.js';

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
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    // Calculate revenue (mock data for now)
    const revenue = 245678;
    
    res.json({
      success: true,
      data: {
        totalUsers,
        revenue,
        courses: totalVideos,
        teachers: totalTeachers,
        admins: totalAdmins,
        superAdmins: 1,
        assessments: totalAssessments
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// Get All Admins with their data counts
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    
    // Get data counts for each admin
    const adminsWithCounts = await Promise.all(
      admins.map(async (admin) => {
        const [studentCount, teacherCount, videoCount, assessmentCount, examCount] = await Promise.all([
          User.countDocuments({ role: 'student', assignedAdmin: admin._id }),
          Teacher.countDocuments({ adminId: admin._id }),
          Video.countDocuments({ adminId: admin._id }),
          Assessment.countDocuments({ adminId: admin._id }),
          Exam.countDocuments({ adminId: admin._id })
        ]);
        
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
            exams: examCount
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: adminsWithCounts
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
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


