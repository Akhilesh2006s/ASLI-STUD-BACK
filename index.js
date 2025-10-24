import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';

// Import models
import User from './models/User.js';
import Video from './models/Video.js';
import LearningPath from './models/LearningPath.js';
import Assessment from './models/Assessment.js';
import Teacher from './models/Teacher.js';
import Subject from './models/Subject.js';
import UserProgress from './models/UserProgress.js';
import Exam from './models/Exam.js';
import Question from './models/Question.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://akhileshsamayamanthula:rxvIPIT4Bzobk9Ne@cluster0.4ej8ne2.mongodb.net/EDU-AI?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  // Seed some sample subjects if none exist
  seedSampleData();
})
.catch(err => console.error('MongoDB connection error:', err));

// Seed sample data
async function seedSampleData() {
  try {
    const subjectCount = await Subject.countDocuments();
    if (subjectCount === 0) {
      console.log('Seeding sample subjects...');
      
      const sampleSubjects = [
        {
          name: 'Mathematics',
          code: 'MATH101',
          description: 'Advanced Mathematics and Calculus',
          grade: '12',
          department: 'Mathematics',
          isActive: true
        },
        {
          name: 'Physics',
          code: 'PHYS101',
          description: 'Classical Mechanics and Thermodynamics',
          grade: '11',
          department: 'Physics',
          isActive: true
        },
        {
          name: 'Chemistry',
          code: 'CHEM101',
          description: 'Organic and Inorganic Chemistry',
          grade: '12',
          department: 'Chemistry',
          isActive: true
        },
        {
          name: 'English',
          code: 'ENG101',
          description: 'Literature and Language',
          grade: '10',
          department: 'English',
          isActive: true
        }
      ];

      await Subject.insertMany(sampleSubjects);
      console.log('Sample subjects created successfully');
    }
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for development
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Set to 'lax' for development
    domain: 'localhost' // Explicitly set domain
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport strategies
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Check for specific admin credentials first
    if (email === 'amenityforge@gmail.com' && password === 'Amenity') {
      // Create or find admin user
      let adminUser = await User.findOne({ email: 'amenityforge@gmail.com' });
      
      if (!adminUser) {
        // Create admin user if doesn't exist
        const hashedPassword = await bcrypt.hash('Amenity', 12);
        adminUser = new User({
          email: 'amenityforge@gmail.com',
          password: hashedPassword,
          fullName: 'Admin User',
          role: 'admin',
          isActive: true
        });
        await adminUser.save();
      } else {
        // Update last login
        adminUser.lastLogin = new Date();
        await adminUser.save();
      }
      
      return done(null, adminUser);
    }

    // Check Teacher model first
    const teacher = await Teacher.findOne({ email });
    console.log('Teacher lookup for', email, ':', teacher ? 'Found' : 'Not found');
    
    if (teacher) {
      console.log('Teacher found:', teacher.email, 'Active:', teacher.isActive);
      const isValidPassword = await bcrypt.compare(password, teacher.password);
      console.log('Password validation for teacher:', isValidPassword);
      
      if (isValidPassword) {
        // Update last login
        teacher.lastLogin = new Date();
        await teacher.save();
        
        // Convert teacher to user format for session
        const teacherUser = {
          _id: teacher._id,
          email: teacher.email,
          fullName: teacher.fullName,
          role: 'teacher',
          isActive: teacher.isActive
        };
        
        console.log('Teacher authentication successful:', teacherUser.email);
        return done(null, teacherUser);
      } else {
        console.log('Teacher password invalid for:', email);
      }
    }

    // Regular user authentication
    const user = await User.findOne({ email });
    
    if (!user) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // First try to find in User model
    let user = await User.findById(id);
    if (user) {
      return done(null, user);
    }
    
    // If not found in User model, try Teacher model
    const teacher = await Teacher.findById(id);
    if (teacher) {
      // Convert teacher to user format for session
      const teacherUser = {
        _id: teacher._id,
        email: teacher.email,
        fullName: teacher.fullName,
        role: 'teacher',
        isActive: teacher.isActive
      };
      return done(null, teacherUser);
    }
    
    // If not found in either model
    done(null, false);
  } catch (error) {
    done(error);
  }
});

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  console.log('Auth check:', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? req.user.email : 'No user',
    sessionID: req.sessionID,
    session: req.session
  });
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  console.log('Admin check:', req.isAuthenticated(), req.user ? req.user.role : 'No user');
  
  // For development, allow access if user is authenticated (temporary bypass)
  if (process.env.NODE_ENV === 'development' && req.isAuthenticated()) {
    console.log('Development mode: Allowing admin access for authenticated user');
    return next();
  }
  
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Access denied' });
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role = 'student' } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      role
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'User created successfully',
      user: { 
        id: newUser._id, 
        email: newUser.email, 
        fullName: newUser.fullName, 
        role: newUser.role 
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', (req, res, next) => {
  console.log('Login attempt:', { email: req.body.email, timestamp: new Date().toISOString() });
  
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (!user) {
      console.log('Login failed:', info.message);
      return res.status(401).json({ message: info.message });
    }
    
    console.log('Login successful for user:', user.email);
    req.logIn(user, async (err) => {
      if (err) {
        console.error('Session creation error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }
      
      let userData = { 
        id: user._id, 
        email: user.email, 
        fullName: user.fullName, 
        role: user.role 
      };

      // If user is a teacher, fetch their subjects
      if (user.role === 'teacher') {
        console.log('Fetching teacher subjects for:', user.email);
        const teacher = await Teacher.findById(user._id).populate('subjects');
        if (teacher) {
          console.log('Teacher found with subjects:', teacher.subjects?.length || 0);
          userData.subjects = teacher.subjects || [];
        }
      }
      
      res.json({ 
        message: 'Login successful',
        user: userData
      });
    });
  })(req, res, next);
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logout successful' });
  });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    console.log('Auth me requested by:', req.user.email, 'Role:', req.user.role);
    
    let userData = { 
      id: req.user._id, 
      email: req.user.email, 
      fullName: req.user.fullName, 
      role: req.user.role 
    };

    // If user is a teacher, fetch their subjects
    if (req.user.role === 'teacher') {
      console.log('Fetching teacher subjects for:', req.user.email);
      const teacher = await Teacher.findById(req.user._id).populate('subjects');
      if (teacher) {
        console.log('Teacher found with subjects:', teacher.subjects?.length || 0);
        userData.subjects = teacher.subjects || [];
      } else {
        console.log('Teacher not found in database');
      }
    }

    console.log('Returning user data:', userData);
    res.json({ user: userData });
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
});

// Public routes
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

app.get('/api/learning-paths', async (req, res) => {
  try {
    const paths = await LearningPath.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(paths);
  } catch (error) {
    console.error('Failed to fetch learning paths:', error);
    res.status(500).json({ message: 'Failed to fetch learning paths' });
  }
});

app.get('/api/assessments', async (req, res) => {
  try {
    const assessments = await Assessment.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    console.error('Failed to fetch assessments:', error);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
});

// Admin routes (protected)
// For development, allow access without authentication
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode: Admin routes accessible without authentication');
  app.use('/api/admin', (req, res, next) => {
    // Mock user for development
    req.user = { _id: 'dev-admin', email: 'dev@admin.com', role: 'admin' };
    req.isAuthenticated = () => true;
    next();
  });
} else {
  app.use('/api/admin', requireAuth, requireAdmin);
}

// Admin video management
app.post('/api/admin/videos', async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, duration, subjectId, difficulty } = req.body;
    
    const newVideo = new Video({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      subjectId,
      difficulty
    });

    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Failed to create video:', error);
    res.status(500).json({ message: 'Failed to create video' });
  }
});

app.put('/api/admin/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedVideo = await Video.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json(updatedVideo);
  } catch (error) {
    console.error('Failed to update video:', error);
    res.status(500).json({ message: 'Failed to update video' });
  }
});

app.delete('/api/admin/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedVideo = await Video.findByIdAndDelete(id);

    if (!deletedVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Failed to delete video:', error);
    res.status(500).json({ message: 'Failed to delete video' });
  }
});

// Admin learning path management
app.post('/api/admin/learning-paths', async (req, res) => {
  try {
    const { title, description, subjectIds, difficulty, estimatedHours, videoIds } = req.body;
    
    const newPath = new LearningPath({
      title,
      description,
      subjectIds,
      difficulty,
      estimatedHours,
      videoIds: videoIds || []
    });

    await newPath.save();
    res.status(201).json(newPath);
  } catch (error) {
    console.error('Failed to create learning path:', error);
    res.status(500).json({ message: 'Failed to create learning path' });
  }
});

app.put('/api/admin/learning-paths/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedPath = await LearningPath.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    res.json(updatedPath);
  } catch (error) {
    console.error('Failed to update learning path:', error);
    res.status(500).json({ message: 'Failed to update learning path' });
  }
});

app.delete('/api/admin/learning-paths/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedPath = await LearningPath.findByIdAndDelete(id);

    if (!deletedPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    res.json({ message: 'Learning path deleted successfully' });
  } catch (error) {
    console.error('Failed to delete learning path:', error);
    res.status(500).json({ message: 'Failed to delete learning path' });
  }
});

// Admin assessment management
app.post('/api/admin/assessments', async (req, res) => {
  try {
    const { title, description, questions, subjectIds, difficulty, duration } = req.body;
    
    // Calculate total points
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    const newAssessment = new Assessment({
      title,
      description,
      questions,
      subjectIds,
      difficulty,
      duration,
      totalPoints
    });

    await newAssessment.save();
    res.status(201).json(newAssessment);
  } catch (error) {
    console.error('Failed to create assessment:', error);
    res.status(500).json({ message: 'Failed to create assessment' });
  }
});

app.put('/api/admin/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Recalculate total points if questions are updated
    if (updates.questions) {
      updates.totalPoints = updates.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    }
    
    const updatedAssessment = await Assessment.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedAssessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json(updatedAssessment);
  } catch (error) {
    console.error('Failed to update assessment:', error);
    res.status(500).json({ message: 'Failed to update assessment' });
  }
});

app.delete('/api/admin/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedAssessment = await Assessment.findByIdAndDelete(id);

    if (!deletedAssessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Failed to delete assessment:', error);
    res.status(500).json({ message: 'Failed to delete assessment' });
  }
});

// Admin user management
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const { email, password, fullName, role = 'student', isActive = true } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      role,
      isActive
    });

    await newUser.save();

    res.status(201).json({
      id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      isActive: newUser.isActive
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Hash password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 12);
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete all students endpoint - MUST be before /:id route
app.delete('/api/admin/users/delete-all', async (req, res) => {
  try {
    // Delete all users with role 'student'
    const result = await User.deleteMany({ role: 'student' });
    
    res.json({ 
      message: `Successfully deleted ${result.deletedCount} students`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Failed to delete all students:', error);
    res.status(500).json({ message: 'Failed to delete all students' });
  }
});

// Teacher management endpoints
app.get('/api/admin/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('subjects').select('-password').sort({ createdAt: -1 });
    res.json(teachers);
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});

app.post('/api/admin/teachers', async (req, res) => {
  try {
    const { email, password, fullName, phone, department, qualifications, subjects } = req.body;
    
    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'Password123', 12);

    // Create new teacher
    const newTeacher = new Teacher({
      email,
      password: hashedPassword,
      fullName,
      phone,
      department,
      qualifications,
      subjects: subjects || [],
      role: 'teacher',
      isActive: true
    });

    await newTeacher.save();
    res.status(201).json({ message: 'Teacher created successfully' });
  } catch (error) {
    console.error('Failed to create teacher:', error);
    res.status(500).json({ message: 'Failed to create teacher' });
  }
});

app.put('/api/admin/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove password from update data if present
    delete updateData.password;
    
    const updatedTeacher = await Teacher.findByIdAndUpdate(id, updateData, { new: true }).populate('subjects');
    
    if (!updatedTeacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(updatedTeacher);
  } catch (error) {
    console.error('Failed to update teacher:', error);
    res.status(500).json({ message: 'Failed to update teacher' });
  }
});

app.delete('/api/admin/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedTeacher = await Teacher.findByIdAndDelete(id);
    if (!deletedTeacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Failed to delete teacher:', error);
    res.status(500).json({ message: 'Failed to delete teacher' });
  }
});

// Subject management endpoints
app.get('/api/admin/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().populate('createdBy', 'fullName email').sort({ createdAt: -1 });
    res.json(subjects);
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

app.post('/api/admin/subjects', async (req, res) => {
  try {
    const { name, description, code, teacher, grade, department } = req.body;
    
    // Check if subject code already exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject code already exists' });
    }

    // Create new subject
    const newSubject = new Subject({
      name,
      description,
      code,
      teacher: teacher || null,
      grade,
      department,
      isActive: true
    });

    await newSubject.save();
    
    // If teacher is assigned, add subject to teacher's subjects array
    if (teacher) {
      await Teacher.findByIdAndUpdate(teacher, { $addToSet: { subjects: newSubject._id } });
    }
    
    res.status(201).json({ message: 'Subject created successfully' });
  } catch (error) {
    console.error('Failed to create subject:', error);
    res.status(500).json({ message: 'Failed to create subject' });
  }
});

app.put('/api/admin/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher } = req.body;
    
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // If teacher is being changed, update both old and new teacher
    if (subject.teacher && subject.teacher.toString() !== teacher) {
      // Remove from old teacher
      await Teacher.findByIdAndUpdate(subject.teacher, { $pull: { subjects: id } });
    }
    
    if (teacher && subject.teacher?.toString() !== teacher) {
      // Add to new teacher
      await Teacher.findByIdAndUpdate(teacher, { $addToSet: { subjects: id } });
    }
    
    const updatedSubject = await Subject.findByIdAndUpdate(id, req.body, { new: true }).populate('teacher', 'fullName email');
    res.json(updatedSubject);
  } catch (error) {
    console.error('Failed to update subject:', error);
    res.status(500).json({ message: 'Failed to update subject' });
  }
});

app.delete('/api/admin/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Remove from teacher's subjects array
    if (subject.teacher) {
      await Teacher.findByIdAndUpdate(subject.teacher, { $pull: { subjects: id } });
    }
    
    await Subject.findByIdAndDelete(id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Failed to delete subject:', error);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
});

// Assign subjects to teacher endpoint
app.post('/api/admin/teachers/:id/assign-subjects', async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectIds } = req.body;
    
    console.log('Assigning subjects to teacher:', { teacherId: id, subjectIds });
    
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      console.log('Teacher not found:', id);
      return res.status(404).json({ message: 'Teacher not found' });
    }

    console.log('Teacher found:', teacher.email, 'Current subjects:', teacher.subjects);

    // Update teacher's subjects
    teacher.subjects = subjectIds || [];
    await teacher.save();

    console.log('Teacher subjects updated:', teacher.subjects);

    // Update subjects to point to this teacher
    if (subjectIds && subjectIds.length > 0) {
      await Subject.updateMany(
        { _id: { $in: subjectIds } },
        { teacher: id }
      );
      console.log('Subjects updated to point to teacher:', id);
    }

    res.json({ message: 'Subjects assigned successfully' });
  } catch (error) {
    console.error('Failed to assign subjects:', error);
    res.status(500).json({ message: 'Failed to assign subjects' });
  }
});

// Exam management endpoints
app.get('/api/admin/exams', async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'fullName email')
      .populate('questions')
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    res.status(500).json({ message: 'Failed to fetch exams' });
  }
});

app.post('/api/admin/exams', async (req, res) => {
  try {
    const {
      title,
      description,
      examType,
      duration,
      totalQuestions,
      totalMarks,
      instructions,
      startDate,
      endDate
    } = req.body;

    const exam = new Exam({
      title,
      description,
      examType: examType || 'weekend',
      duration,
      totalQuestions,
      totalMarks,
      instructions,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: req.user.id
    });

    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    console.error('Failed to create exam:', error);
    res.status(500).json({ message: 'Failed to create exam' });
  }
});

app.put('/api/admin/exams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert date strings to Date objects if present
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const exam = await Exam.findByIdAndUpdate(id, updateData, { new: true });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Failed to update exam:', error);
    res.status(500).json({ message: 'Failed to update exam' });
  }
});

app.delete('/api/admin/exams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete all questions associated with this exam
    await Question.deleteMany({ exam: id });
    
    const deletedExam = await Exam.findByIdAndDelete(id);
    if (!deletedExam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Failed to delete exam:', error);
    res.status(500).json({ message: 'Failed to delete exam' });
  }
});

// Student exam endpoints
app.get('/api/student/exams', requireAuth, async (req, res) => {
  try {
    console.log('Fetching student exams for user:', req.user.id);
    
    const exams = await Exam.find({ isActive: true })
      .populate('questions')
      .sort({ createdAt: -1 });
    
    console.log('Found exams:', exams.length);
    console.log('Exam details:', exams.map(exam => ({
      id: exam._id,
      title: exam.title,
      examType: exam.examType,
      isActive: exam.isActive,
      questionsCount: exam.questions.length
    })));
    
    res.json(exams);
  } catch (error) {
    console.error('Failed to fetch student exams:', error);
    res.status(500).json({ message: 'Failed to fetch exams', error: error.message });
  }
});

app.get('/api/student/exams/:examId', requireAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID format' });
    }
    
    const exam = await Exam.findById(examId)
      .populate('questions');
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    res.json(exam);
  } catch (error) {
    console.error('Failed to fetch exam:', error);
    res.status(500).json({ message: 'Failed to fetch exam' });
  }
});

// Save exam results
app.post('/api/student/exam-results', requireAuth, async (req, res) => {
  try {
    const resultData = {
      ...req.body,
      userId: req.user.id,
      completedAt: new Date()
    };
    
    // Create a new result document (you might want to create a Result model)
    // For now, we'll just return success
    console.log('Exam result saved:', resultData);
    
    res.status(201).json({ message: 'Result saved successfully' });
  } catch (error) {
    console.error('Failed to save exam result:', error);
    res.status(500).json({ message: 'Failed to save result' });
  }
});

// Get student exam results
app.get('/api/student/exam-results', requireAuth, async (req, res) => {
  try {
    // For now, return mock data. In a real app, you'd fetch from a Results collection
    const mockResults = [
      {
        examId: '68fa67db5a9b19d772d960c5',
        examTitle: 'JEE Main Practice Test 1',
        totalQuestions: 10,
        correctAnswers: 8,
        wrongAnswers: 2,
        unattempted: 0,
        totalMarks: 40,
        obtainedMarks: 32,
        percentage: 80,
        timeTaken: 1800,
        subjectWiseScore: {
          maths: { correct: 3, total: 4, marks: 12 },
          physics: { correct: 3, total: 3, marks: 12 },
          chemistry: { correct: 2, total: 3, marks: 8 }
        }
      }
    ];
    
    res.json(mockResults);
  } catch (error) {
    console.error('Failed to fetch exam results:', error);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

// Test endpoint for debugging
app.get('/api/admin/test', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Quick test endpoint to verify teacher account
app.get('/api/debug/test-teacher', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ email: 'teacher@test.com' });
    if (!teacher) {
      return res.json({ 
        exists: false, 
        message: 'Teacher account does not exist' 
      });
    }
    
    // Test password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare('Password123', teacher.password);
    
    res.json({
      exists: true,
      email: teacher.email,
      fullName: teacher.fullName,
      isActive: teacher.isActive,
      passwordValid: isPasswordValid,
      message: isPasswordValid ? 'Teacher account is ready' : 'Password mismatch'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check exams in database
app.get('/api/debug/exams', async (req, res) => {
  try {
    const allExams = await Exam.find({}).populate('questions');
    const activeExams = await Exam.find({ isActive: true }).populate('questions');
    
    res.json({
      totalExams: allExams.length,
      activeExams: activeExams.length,
      allExams: allExams.map(exam => ({
        id: exam._id,
        title: exam.title,
        examType: exam.examType,
        isActive: exam.isActive,
        questionsCount: exam.questions.length,
        createdAt: exam.createdAt
      })),
      activeExams: activeExams.map(exam => ({
        id: exam._id,
        title: exam.title,
        examType: exam.examType,
        isActive: exam.isActive,
        questionsCount: exam.questions.length
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to show exam questions and correct answers
app.get('/api/debug/exam-answers/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).populate('questions');
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    const questionsWithAnswers = exam.questions.map((question, index) => ({
      questionNumber: index + 1,
      questionId: question._id,
      questionText: question.questionText,
      questionImage: question.questionImage,
      questionType: question.questionType,
      options: question.options,
      correctAnswer: question.correctAnswer,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      subject: question.subject
    }));
    
    res.json({
      examId: exam._id,
      examTitle: exam.title,
      examType: exam.examType,
      totalQuestions: exam.questions.length,
      questions: questionsWithAnswers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create test student account for easy testing
app.post('/api/debug/create-test-student', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    
    // Check if test student already exists
    const existingStudent = await User.findOne({ email: 'student@test.com' });
    if (existingStudent) {
      return res.json({ 
        message: 'Test student already exists',
        student: {
          email: existingStudent.email,
          fullName: existingStudent.fullName,
          role: existingStudent.role
        }
      });
    }
    
    // Create test student
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testStudent = new User({
      fullName: 'Test Student',
      email: 'student@test.com',
      password: hashedPassword,
      role: 'student',
      isActive: true,
      classNumber: 'Test-Class-1',
      phone: '+1234567890'
    });
    
    await testStudent.save();
    
    res.json({
      message: 'Test student created successfully',
      student: {
        email: testStudent.email,
        fullName: testStudent.fullName,
        role: testStudent.role,
        password: 'password123'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create test user with specific email
app.post('/api/debug/create-user', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { email, fullName, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ 
        message: 'User already exists',
        user: {
          email: existingUser.email,
          fullName: existingUser.fullName,
          role: existingUser.role
        }
      });
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const newUser = new User({
      fullName: fullName || 'Test User',
      email: email,
      password: hashedPassword,
      role: role || 'student',
      isActive: true,
      classNumber: 'Test-Class-1',
      phone: '+1234567890'
    });
    
    await newUser.save();
    
    res.json({
      message: 'User created successfully',
      user: {
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        password: 'Password123'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all existing users (for debugging)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      message: 'Existing users found',
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }))
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all existing teachers (for debugging)
app.get('/api/debug/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('subjects').select('-password').sort({ createdAt: -1 });
    
    res.json({
      message: 'Existing teachers found',
      count: teachers.length,
      teachers: teachers.map(teacher => ({
        id: teacher._id,
        email: teacher.email,
        fullName: teacher.fullName,
        department: teacher.department,
        qualifications: teacher.qualifications,
        subjects: teacher.subjects?.map(s => ({ id: s._id, name: s.name })) || [],
        subjectsCount: teacher.subjects?.length || 0,
        isActive: teacher.isActive,
        createdAt: teacher.createdAt,
        lastLogin: teacher.lastLogin
      }))
    });
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create test teacher account for easy testing
app.post('/api/debug/create-test-teacher', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    
    // Check if test teacher already exists
    const existingTeacher = await Teacher.findOne({ email: 'teacher@test.com' });
    if (existingTeacher) {
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.default.hash('Password123', 10);
      existingTeacher.password = hashedPassword;
      await existingTeacher.save();
      
      return res.json({ 
        message: 'Test teacher already exists, password updated',
        teacher: {
          email: existingTeacher.email,
          fullName: existingTeacher.fullName,
          role: existingTeacher.role,
          password: 'Password123'
        }
      });
    }
    
    // Create test teacher
    const hashedPassword = await bcrypt.default.hash('Password123', 10);
    const testTeacher = new Teacher({
      email: 'teacher@test.com',
      password: hashedPassword,
      fullName: 'Test Teacher',
      phone: '+1234567890',
      department: 'Science',
      qualifications: 'M.Sc Physics, B.Ed',
      role: 'teacher',
      isActive: true
    });
    
    await testTeacher.save();
    
    res.json({ 
      message: 'Test teacher created successfully',
      teacher: {
        email: testTeacher.email,
        fullName: testTeacher.fullName,
        role: testTeacher.role,
        password: 'Password123'
      }
    });
  } catch (error) {
    console.error('Failed to create test teacher:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a guaranteed working test teacher
app.post('/api/debug/create-working-teacher', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    
    // Delete any existing test teacher first
    await Teacher.deleteOne({ email: 'testteacher@cognilearn.com' });
    
    // Create guaranteed working teacher
    const hashedPassword = await bcrypt.default.hash('Teacher123', 10);
    const workingTeacher = new Teacher({
      email: 'testteacher@cognilearn.com',
      password: hashedPassword,
      fullName: 'Test Teacher CogniLearn',
      phone: '+1234567890',
      department: 'Mathematics',
      qualifications: 'M.Sc Mathematics, B.Ed',
      role: 'teacher',
      isActive: true
    });
    
    await workingTeacher.save();
    
    res.json({ 
      message: 'Working test teacher created successfully',
      credentials: {
        email: 'testteacher@cognilearn.com',
        password: 'Teacher123',
        fullName: 'Test Teacher CogniLearn',
        role: 'teacher'
      },
      loginUrl: 'http://localhost:5174/signin'
    });
  } catch (error) {
    console.error('Failed to create working teacher:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create multiple teacher accounts for testing
app.post('/api/debug/create-multiple-teachers', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    
    const teachers = [
      {
        email: 'math.teacher@cognilearn.com',
        password: 'MathTeacher123',
        fullName: 'Dr. Sarah Johnson',
        phone: '+1234567891',
        department: 'Mathematics',
        qualifications: 'Ph.D Mathematics, M.Ed',
        role: 'teacher',
        isActive: true
      },
      {
        email: 'physics.teacher@cognilearn.com',
        password: 'PhysicsTeacher123',
        fullName: 'Prof. Michael Chen',
        phone: '+1234567892',
        department: 'Physics',
        qualifications: 'Ph.D Physics, B.Ed',
        role: 'teacher',
        isActive: true
      },
      {
        email: 'chemistry.teacher@cognilearn.com',
        password: 'ChemTeacher123',
        fullName: 'Dr. Emily Rodriguez',
        phone: '+1234567893',
        department: 'Chemistry',
        qualifications: 'Ph.D Chemistry, M.Ed',
        role: 'teacher',
        isActive: true
      },
      {
        email: 'english.teacher@cognilearn.com',
        password: 'EnglishTeacher123',
        fullName: 'Ms. Jennifer Smith',
        phone: '+1234567894',
        department: 'English',
        qualifications: 'M.A English Literature, B.Ed',
        role: 'teacher',
        isActive: true
      }
    ];
    
    const createdTeachers = [];
    
    for (const teacherData of teachers) {
      // Delete existing teacher if exists
      await Teacher.deleteOne({ email: teacherData.email });
      
      // Hash password
      const hashedPassword = await bcrypt.default.hash(teacherData.password, 10);
      
      // Create teacher
      const teacher = new Teacher({
        ...teacherData,
        password: hashedPassword
      });
      
      await teacher.save();
      createdTeachers.push({
        email: teacherData.email,
        password: teacherData.password,
        fullName: teacherData.fullName,
        department: teacherData.department,
        role: teacherData.role
      });
    }
    
    res.json({ 
      message: 'Multiple teachers created successfully',
      teachers: createdTeachers,
      loginUrl: 'http://localhost:5174/signin',
      totalCreated: createdTeachers.length
    });
  } catch (error) {
    console.error('Failed to create multiple teachers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Teacher routes (protected)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/teacher', (req, res, next) => {
    // Development bypass - mock teacher user
    req.user = { 
      _id: '68fb5f00cde14c9994483094', 
      email: 'teacher@test.com', 
      fullName: 'Test Teacher', 
      role: 'teacher' 
    };
    req.isAuthenticated = () => true;
    next();
  });
} else {
  app.use('/api/teacher', requireAuth, (req, res, next) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }
    next();
  });
}

// Get teacher profile with subjects
app.get('/api/teacher/profile', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user._id).populate('subjects');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    console.log('Teacher profile requested:', {
      id: teacher._id,
      email: teacher.email,
      subjectsCount: teacher.subjects?.length || 0,
      subjects: teacher.subjects?.map(s => s.name) || []
    });
    
    res.json({
      id: teacher._id,
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department,
      qualifications: teacher.qualifications,
      subjects: teacher.subjects || []
    });
  } catch (error) {
    console.error('Failed to fetch teacher profile:', error);
    res.status(500).json({ message: 'Failed to fetch teacher profile' });
  }
});

// Assign subjects to current teacher (for testing)
app.post('/api/teacher/assign-subjects', async (req, res) => {
  try {
    const { subjectIds } = req.body;
    const teacherId = req.user._id;
    
    console.log('Assigning subjects to teacher:', { teacherId, subjectIds });
    
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Update teacher's subjects
    teacher.subjects = subjectIds;
    await teacher.save();
    
    // Populate subjects for response
    await teacher.populate('subjects');
    
    res.json({
      message: 'Subjects assigned successfully',
      teacher: {
        id: teacher._id,
        email: teacher.email,
        subjects: teacher.subjects
      }
    });
  } catch (error) {
    console.error('Failed to assign subjects:', error);
    res.status(500).json({ message: 'Failed to assign subjects' });
  }
});

// Teacher content creation endpoints
app.post('/api/teacher/quizzes', async (req, res) => {
  try {
    const { title, description, subject, duration, difficulty, questions } = req.body;
    const teacherId = req.user._id;
    
    // Calculate total points
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    const newQuiz = new Assessment({
      title,
      description,
      questions,
      subjectIds: [subject],
      difficulty,
      duration,
      totalPoints,
      createdBy: teacherId,
      isPublished: true
    });

    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Failed to create quiz:', error);
    res.status(500).json({ message: 'Failed to create quiz' });
  }
});

app.post('/api/teacher/videos', async (req, res) => {
  try {
    const { title, description, videoUrl, subject, duration, difficulty } = req.body;
    const teacherId = req.user._id;
    
    // Extract YouTube video ID from URL
    let youtubeId = '';
    if (videoUrl && videoUrl.includes('youtube.com/watch?v=')) {
      youtubeId = videoUrl.split('v=')[1].split('&')[0];
    } else if (videoUrl && videoUrl.includes('youtu.be/')) {
      youtubeId = videoUrl.split('youtu.be/')[1].split('?')[0];
    }
    
    const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : '';
    
    const newVideo = new Video({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration: parseInt(duration),
      subjectId: subject,
      difficulty,
      createdBy: teacherId,
      isPublished: true
    });

    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Failed to create video:', error);
    res.status(500).json({ message: 'Failed to create video' });
  }
});

app.post('/api/teacher/assessments', async (req, res) => {
  try {
    const { title, description, subject, type, duration, difficulty, questions, isDriveQuiz, driveLink } = req.body;
    const teacherId = req.user._id;
    
    // Calculate total points
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    const newAssessment = new Assessment({
      title,
      description,
      questions,
      subjectIds: [subject],
      difficulty,
      duration,
      totalPoints,
      createdBy: new mongoose.Types.ObjectId(teacherId),
      isPublished: true,
      isDriveQuiz: isDriveQuiz || false,
      driveLink: driveLink || ''
    });

    await newAssessment.save();
    res.status(201).json(newAssessment);
  } catch (error) {
    console.error('Failed to create assessment:', error);
    res.status(500).json({ message: 'Failed to create assessment' });
  }
});

// Get teacher's content
app.get('/api/teacher/quizzes', async (req, res) => {
  try {
    const teacherId = req.user._id;
    const quizzes = await Assessment.find({ 
      createdBy: teacherId,
      isPublished: true 
    }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error('Failed to fetch teacher quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

app.get('/api/teacher/videos', async (req, res) => {
  try {
    const teacherId = req.user._id;
    const videos = await Video.find({ 
      createdBy: teacherId,
      isPublished: true 
    }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Failed to fetch teacher videos:', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

app.get('/api/teacher/assessments', async (req, res) => {
  try {
    const teacherId = req.user._id;
    const assessments = await Assessment.find({ 
      createdBy: teacherId,
      isPublished: true 
    }).sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    console.error('Failed to fetch teacher assessments:', error);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
});

// Student endpoints to access teacher-created content
app.get('/api/student/content', async (req, res) => {
  try {
    // Get all published content from teachers
    const [videos, assessments] = await Promise.all([
      Video.find({ isPublished: true }).populate('createdBy', 'fullName').sort({ createdAt: -1 }),
      Assessment.find({ isPublished: true }).populate('createdBy', 'fullName').sort({ createdAt: -1 })
    ]);
    
    res.json({
      videos,
      assessments,
      totalVideos: videos.length,
      totalAssessments: assessments.length
    });
  } catch (error) {
    console.error('Failed to fetch student content:', error);
    res.status(500).json({ message: 'Failed to fetch content' });
  }
});

app.get('/api/student/videos', async (req, res) => {
  try {
    const videos = await Video.find({ isPublished: true })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Failed to fetch student videos:', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

app.get('/api/student/assessments', async (req, res) => {
  try {
    const assessments = await Assessment.find({ isPublished: true })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    console.error('Failed to fetch student assessments:', error);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
});

app.get('/api/student/quizzes', async (req, res) => {
  try {
    const quizzes = await Assessment.find({ isPublished: true })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error('Failed to fetch student quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// Question management endpoints
app.get('/api/admin/exams/:examId/questions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID format' });
    }
    
    console.log('Fetching questions for exam ID:', examId);
    const questions = await Question.find({ exam: examId }).sort({ createdAt: -1 });
    console.log('Found questions:', questions.length);
    res.json(questions);
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    res.status(500).json({ message: 'Failed to fetch questions', error: error.message });
  }
});

app.post('/api/admin/exams/:examId/questions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID format' });
    }
    const {
      questionText,
      questionImage,
      questionType,
      options,
      correctAnswer,
      marks,
      negativeMarks,
      explanation,
      subject
    } = req.body;

    console.log('Creating question with data:', {
      questionText,
      questionImage,
      questionType,
      options,
      correctAnswer,
      marks,
      negativeMarks,
      explanation,
      subject,
      examId
    });

    // Validate that either question text or image is provided
    if (!questionText?.trim() && !questionImage) {
      return res.status(400).json({ message: 'Either question text or image is required' });
    }

    // Clean up questionText - set to empty string if only whitespace
    const cleanQuestionText = questionText?.trim() || '';

    // Validate question type and options
    if ((questionType === 'mcq' || questionType === 'multiple') && (!options || options.length === 0)) {
      return res.status(400).json({ message: 'Options are required for MCQ and Multiple Choice questions' });
    }

    const question = new Question({
      questionText: cleanQuestionText,
      questionImage,
      questionType,
      options,
      correctAnswer,
      marks: marks || 1,
      negativeMarks: negativeMarks || 0,
      explanation,
      subject: subject || 'maths',
      exam: examId,
      createdBy: req.user.id
    });

    await question.save();
    console.log('Question saved successfully:', question._id);

    // Add question to exam
    await Exam.findByIdAndUpdate(examId, { $push: { questions: question._id } });
    console.log('Question added to exam:', examId);

    res.status(201).json(question);
  } catch (error) {
    console.error('Failed to create question:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to create question', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.put('/api/admin/questions/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await Question.findByIdAndUpdate(id, updateData, { new: true });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    console.error('Failed to update question:', error);
    res.status(500).json({ message: 'Failed to update question' });
  }
});

app.delete('/api/admin/questions/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Remove question from exam
    await Exam.findByIdAndUpdate(question.exam, { $pull: { questions: id } });
    
    await Question.findByIdAndDelete(id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Failed to delete question:', error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
});

// Image upload endpoint for questions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/questions/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'question-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const imageUpload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

app.post('/api/admin/upload-question-image', imageUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/questions/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Failed to upload image:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

app.patch('/api/admin/users/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { isActive, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Failed to toggle user status:', error);
    res.status(500).json({ message: 'Failed to toggle user status' });
  }
});

// CSV upload endpoint
app.post('/api/admin/users/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('CSV upload request received');
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to string
    const csvData = req.file.buffer.toString('utf8');
    
    // Parse CSV data
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return res.status(400).json({ message: 'CSV file must have at least a header and one data row' });
    }

    // Get header row
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers - check for both classNumber and classnumber
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

        // Get class number from the class field (handles both classnumber and classNumber)
        const classNumber = userData.classnumber || 'Unassigned';

        // Create new user
        const newUser = new User({
          fullName: userData.name,
          email: userData.email,
          classNumber: classNumber,
          phone: userData.phone,
          password: hashedPassword,
          role: 'student',
          isActive: true
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
    console.error('Failed to upload CSV:', error);
    res.status(500).json({ message: 'Failed to upload CSV' });
  }
});

// Classes endpoint - returns classes based on student data
app.get('/api/admin/classes', async (req, res) => {
  try {
    // Get all students to group by class
    const students = await User.find({ role: 'student' }).select('fullName email classNumber phone isActive createdAt lastLogin');
    
    // Group students by class
    const classMap = new Map();
    
    students.forEach(student => {
      const classKey = student.classNumber || 'Unassigned';
      if (!classMap.has(classKey)) {
        classMap.set(classKey, {
          id: classKey,
          name: `Class ${classKey}`,
          description: `Students in class ${classKey}`,
          subject: 'General',
          grade: classKey,
          teacher: 'TBD',
          schedule: 'Mon-Fri 9:00 AM',
          room: `Room ${classKey}`,
          studentCount: 0,
          students: [],
          createdAt: new Date().toISOString()
        });
      }
      
      const classObj = classMap.get(classKey);
      classObj.students.push({
        id: student._id,
        name: student.fullName,
        email: student.email,
        classNumber: student.classNumber,
        phone: student.phone,
        status: student.isActive ? 'active' : 'inactive',
        createdAt: student.createdAt,
        lastLogin: student.lastLogin
      });
      classObj.studentCount++;
    });
    
    const classes = Array.from(classMap.values());
    res.json(classes);
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Create new class
app.post('/api/admin/classes', async (req, res) => {
  try {
    const { name, description, subject, grade, teacher, schedule, room } = req.body;
    
    // For now, just return success - in a real app, you'd save to database
    const newClass = {
      id: Date.now().toString(),
      name,
      description,
      subject,
      grade,
      teacher,
      schedule,
      room,
      studentCount: 0,
      students: [],
      createdAt: new Date().toISOString()
    };
    
    res.json(newClass);
  } catch (error) {
    console.error('Failed to create class:', error);
    res.status(500).json({ message: 'Failed to create class' });
  }
});

// Delete class
app.delete('/api/admin/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, just return success - in a real app, you'd delete from database
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Failed to delete class:', error);
    res.status(500).json({ message: 'Failed to delete class' });
  }
});


// Admin Quizzes endpoints
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await Assessment.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error('Failed to fetch quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

app.post('/api/quizzes', async (req, res) => {
  try {
    const { title, description, subject, difficulty, duration, questions } = req.body;
    
    // Map difficulty values to model enum
    const difficultyMap = {
      'easy': 'beginner',
      'medium': 'intermediate', 
      'hard': 'advanced'
    };
    
    const newQuiz = new Assessment({
      title,
      description,
      subjectIds: [subject],
      difficulty: difficultyMap[difficulty] || 'beginner',
      duration,
      questions: [], // Start with empty questions array
      totalPoints: 0, // Will be calculated when questions are added
      isPublished: true,
      createdBy: null // Remove user dependency for now
    });

    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Failed to create quiz:', error);
    res.status(500).json({ message: 'Failed to create quiz' });
  }
});

app.put('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const quiz = await Assessment.findByIdAndUpdate(id, updateData, { new: true });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Failed to update quiz:', error);
    res.status(500).json({ message: 'Failed to update quiz' });
  }
});

app.delete('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Assessment.findByIdAndDelete(id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Failed to delete quiz:', error);
    res.status(500).json({ message: 'Failed to delete quiz' });
  }
});

app.patch('/api/quizzes/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const quiz = await Assessment.findByIdAndUpdate(id, { isPublished: isActive }, { new: true });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Failed to toggle quiz status:', error);
    res.status(500).json({ message: 'Failed to toggle quiz status' });
  }
});

// Admin Videos endpoints
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const { title, description, subject, duration, videoUrl, thumbnail, youtubeUrl, isYouTubeVideo } = req.body;
    
    // Map difficulty values to model enum
    const difficultyMap = {
      'easy': 'beginner',
      'medium': 'intermediate', 
      'hard': 'advanced'
    };
    
    const newVideo = new Video({
      title,
      description,
      subjectId: subject,
      duration,
      videoUrl: isYouTubeVideo ? '' : (videoUrl || ''),
      thumbnailUrl: isYouTubeVideo ? '' : (thumbnail || ''),
      youtubeUrl: isYouTubeVideo ? (youtubeUrl || '') : '',
      isYouTubeVideo: isYouTubeVideo || false,
      difficulty: difficultyMap['medium'] || 'beginner', // Default to medium
      isPublished: true,
      createdBy: null // Remove user dependency for now
    });

    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Failed to create video:', error);
    res.status(500).json({ message: 'Failed to create video' });
  }
});

app.put('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const video = await Video.findByIdAndUpdate(id, updateData, { new: true });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('Failed to update video:', error);
    res.status(500).json({ message: 'Failed to update video' });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Video.findByIdAndDelete(id);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Failed to delete video:', error);
    res.status(500).json({ message: 'Failed to delete video' });
  }
});

app.patch('/api/videos/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const video = await Video.findByIdAndUpdate(id, { isPublished: isActive }, { new: true });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('Failed to toggle video status:', error);
    res.status(500).json({ message: 'Failed to toggle video status' });
  }
});

// Admin Assessments endpoints
app.get('/api/assessments', async (req, res) => {
  try {
    const assessments = await Assessment.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    console.error('Failed to fetch assessments:', error);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
});

app.post('/api/assessments', async (req, res) => {
  try {
    const { title, description, subject, type, difficulty, duration, totalMarks, passingMarks, questions, driveLink, isDriveQuiz } = req.body;
    
    // Map difficulty values to model enum
    const difficultyMap = {
      'easy': 'beginner',
      'medium': 'intermediate', 
      'hard': 'advanced'
    };
    
    const newAssessment = new Assessment({
      title,
      description,
      subjectIds: [subject],
      type,
      difficulty: difficultyMap[difficulty] || 'beginner',
      duration,
      totalPoints: totalMarks,
      passingPoints: passingMarks,
      questions: [], // Start with empty questions array
      driveLink: driveLink || '',
      isDriveQuiz: isDriveQuiz || false,
      isPublished: true,
      createdBy: null // Remove user dependency for now
    });

    await newAssessment.save();
    res.status(201).json(newAssessment);
  } catch (error) {
    console.error('Failed to create assessment:', error);
    res.status(500).json({ message: 'Failed to create assessment' });
  }
});

app.put('/api/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const assessment = await Assessment.findByIdAndUpdate(id, updateData, { new: true });
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.json(assessment);
  } catch (error) {
    console.error('Failed to update assessment:', error);
    res.status(500).json({ message: 'Failed to update assessment' });
  }
});

app.delete('/api/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Assessment.findByIdAndDelete(id);
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Failed to delete assessment:', error);
    res.status(500).json({ message: 'Failed to delete assessment' });
  }
});

app.patch('/api/assessments/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const assessment = await Assessment.findByIdAndUpdate(id, { isPublished: isActive }, { new: true });
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.json(assessment);
  } catch (error) {
    console.error('Failed to toggle assessment status:', error);
    res.status(500).json({ message: 'Failed to toggle assessment status' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// AI Chat endpoints
import { restGeminiService } from './services/rest-gemini.cjs';

// Store chat sessions in memory (in production, use a database)
const chatSessions = new Map();

app.post('/api/ai-chat', async (req, res) => {
  try {
    const { userId, message, context } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ message: 'User ID and message are required' });
    }

    // Get or create chat session
    let session = chatSessions.get(userId);
    if (!session) {
      session = {
        id: Date.now().toString(),
        userId,
        messages: [],
        context: context || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      chatSessions.set(userId, session);
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    // Generate AI response
    const aiResponse = await restGeminiService.generateResponse(
      message, 
      context || session.context, 
      session.messages.slice(-10) // Last 10 messages for context
    );

    // Add AI response
    const aiMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };
    session.messages.push(aiMessage);

    // Update session
    session.updatedAt = new Date();
    session.context = { ...session.context, ...context };

    res.json({
      success: true,
      message: aiResponse,
      session: {
        id: session.id,
        messages: session.messages,
        context: session.context
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ message: 'Failed to process chat message' });
  }
});

app.get('/api/users/:userId/chat-sessions', async (req, res) => {
  try {
    const { userId } = req.params;
    const session = chatSessions.get(userId);
    
    if (!session) {
      return res.json([]);
    }

    res.json([session]);
  } catch (error) {
    console.error('Failed to fetch chat sessions:', error);
    res.status(500).json({ message: 'Failed to fetch chat sessions' });
  }
});

app.post('/api/ai-chat/analyze-image', async (req, res) => {
  try {
    const { image, context } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const analysis = await restGeminiService.analyzeImage(base64Data, context);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze image' });
  }
});

// Subject Management endpoints
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .populate('videos', 'title duration')
      .populate('quizzes', 'question')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
  }
});

app.get('/api/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id)
      .populate('videos', 'title description duration videoUrl youtubeUrl isYouTubeVideo thumbnailUrl views createdAt')
      .populate('quizzes', 'question options correctAnswer difficulty duration createdAt')
      .populate('createdBy', 'fullName');
    
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    res.json({ success: true, subject });
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subject' });
  }
});

app.post('/api/subjects', async (req, res) => {
  try {
    const { name, description, category, difficulty, duration, subjects, color, icon } = req.body;
    
    const subject = new Subject({
      name,
      description,
      category,
      difficulty,
      duration,
      subjects,
      color,
      icon,
      createdBy: req.user?.id || 'admin-user' // Fallback for testing
    });
    
    await subject.save();
    res.status(201).json({ success: true, subject });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ success: false, message: 'Failed to create subject' });
  }
});

app.put('/api/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const subject = await Subject.findByIdAndUpdate(id, updates, { new: true });
    
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    res.json({ success: true, subject });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ success: false, message: 'Failed to update subject' });
  }
});

app.delete('/api/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findByIdAndUpdate(id, { isActive: false }, { new: true });
    
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    res.json({ success: true, message: 'Subject deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating subject:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate subject' });
  }
});

// Add video to subject
app.post('/api/subjects/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const { videoId } = req.body;
    
    const subject = await Subject.findByIdAndUpdate(
      id,
      { $addToSet: { videos: videoId } },
      { new: true }
    );
    
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    res.json({ success: true, subject });
  } catch (error) {
    console.error('Error adding video to subject:', error);
    res.status(500).json({ success: false, message: 'Failed to add video to subject' });
  }
});

// Add quiz to subject
app.post('/api/subjects/:id/quizzes', async (req, res) => {
  try {
    const { id } = req.params;
    const { quizId } = req.body;
    
    const subject = await Subject.findByIdAndUpdate(
      id,
      { $addToSet: { quizzes: quizId } },
      { new: true }
    );
    
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    res.json({ success: true, subject });
  } catch (error) {
    console.error('Error adding quiz to subject:', error);
    res.status(500).json({ success: false, message: 'Failed to add quiz to subject' });
  }
});

// Assign subjects to any teacher (for debugging)
app.post('/api/debug/assign-subjects-to-teacher', async (req, res) => {
  try {
    const { teacherEmail, subjectIds } = req.body;
    
    const teacher = await Teacher.findOne({ email: teacherEmail });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Update teacher's subjects
    teacher.subjects = subjectIds;
    await teacher.save();
    
    // Populate subjects for response
    await teacher.populate('subjects');
    
    res.json({
      message: 'Subjects assigned successfully',
      teacher: {
        id: teacher._id,
        email: teacher.email,
        fullName: teacher.fullName,
        subjects: teacher.subjects
      }
    });
  } catch (error) {
    console.error('Failed to assign subjects:', error);
    res.status(500).json({ message: 'Failed to assign subjects' });
  }
});

// Debug current session
app.get('/api/debug/current-session', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role
    } : null
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
