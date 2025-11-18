import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from './config/database.js';
import superAdminRoutes from './routes/superAdmin.js';
import adminRoutes from './routes/admin.js';
import { verifyToken, verifySuperAdmin } from './middleware/auth.js';
import User from './models/User.js';
import { validateEnv } from './utils/envValidator.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Require JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://asli-frontend.vercel.app' : 'http://localhost:5173'),
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Super Admin Backend',
    version: '1.0.0'
  });
});

// Auth login endpoint (Handles Super Admin and regular admin logins)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }
    
    // Check for Super Admin in database first
    const superAdminUser = await User.findOne({ 
      email: email.toLowerCase().trim(),
      role: 'super-admin',
      isActive: true
    });
    
    if (superAdminUser) {
      const isPasswordValid = await bcrypt.compare(password, superAdminUser.password);
      if (isPasswordValid) {
        const token = jwt.sign(
          { 
            id: superAdminUser._id.toString(),
            email: superAdminUser.email,
            fullName: superAdminUser.fullName,
            role: 'super-admin'
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        await User.findByIdAndUpdate(superAdminUser._id, { lastLogin: new Date() });
        
        return res.json({
          success: true,
          token,
          user: {
            id: superAdminUser._id.toString(),
            email: superAdminUser.email,
            fullName: superAdminUser.fullName,
            role: 'super-admin'
          }
        });
      }
    }
    
    // Fallback: Check environment variables for super admin (for initial setup)
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
    
    if (SUPER_ADMIN_EMAIL && SUPER_ADMIN_PASSWORD && 
        email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim() && 
        password === SUPER_ADMIN_PASSWORD) {
      // Create super admin user in database if it doesn't exist
      let superAdmin = await User.findOne({ role: 'super-admin' });
      if (!superAdmin) {
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
        superAdmin = new User({
          email: SUPER_ADMIN_EMAIL.toLowerCase().trim(),
          password: hashedPassword,
          fullName: 'Super Admin',
          role: 'super-admin',
          isActive: true
        });
        await superAdmin.save();
      }
      
      const token = jwt.sign(
        { 
          id: superAdmin._id.toString(),
          email: superAdmin.email,
          fullName: superAdmin.fullName,
          role: 'super-admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      await User.findByIdAndUpdate(superAdmin._id, { lastLogin: new Date() });
      
      return res.json({
        success: true,
        token,
        user: {
          id: superAdmin._id.toString(),
          email: superAdmin.email,
          fullName: superAdmin.fullName,
          role: 'super-admin'
        }
      });
    }
    
    // Check for regular admin/teacher/student login in database
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Auth verification endpoint
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Super Admin Routes
app.use('/api/super-admin', superAdminRoutes);

// Protected routes (require authentication)
app.use('/api/super-admin/protected', verifyToken, verifySuperAdmin, superAdminRoutes);

// Admin Routes
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  // Log full error in development, minimal info in production
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  } else {
    console.error('Error:', err.message);
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry found'
    });
  }
  
  // Don't expose stack traces in production
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Super Admin Backend Server Started!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN || 
                  process.env.RAILWAY_STATIC_URL || 
                  `http://localhost:${PORT}`;
  console.log(`🌐 API Base URL: ${baseUrl}`);
  console.log(`📊 Dashboard Stats: ${baseUrl}/api/super-admin/stats`);
  console.log('✅ Ready to accept requests!');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('');
    console.log('⚠️  Development mode: Using environment variables for super admin');
    if (process.env.SUPER_ADMIN_EMAIL) {
      console.log(`   Super Admin Email: ${process.env.SUPER_ADMIN_EMAIL}`);
    } else {
      console.log('   ⚠️  SUPER_ADMIN_EMAIL not set - create super admin user in database');
    }
  }
});

export default app;
