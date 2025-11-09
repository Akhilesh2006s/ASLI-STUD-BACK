import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from './config/database.js';
import superAdminRoutes from './routes/superAdmin.js';
import adminRoutes from './routes/admin.js';
import { verifyToken, verifySuperAdmin } from './middleware/auth.js';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://asli-stud-back-production.up.railway.app' : 'http://localhost:5173'),
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
    console.log('Login attempt:', { email: req.body.email, timestamp: new Date().toISOString() });
    
    const { email, password } = req.body;
    
    // Check for Super Admin credentials first
    if (email === 'Amenity@gmail.com' && password === 'Amenity') {
      console.log('Super Admin login detected');
      const token = jwt.sign(
        { 
          id: 'super-admin-001',
          email: 'Amenity@gmail.com',
          fullName: 'Super Admin',
          role: 'super-admin'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        token,
        user: {
          id: 'super-admin-001',
          email: 'Amenity@gmail.com',
          fullName: 'Super Admin',
          role: 'super-admin'
        }
      });
    }
    
    // Check for regular admin login in database
    console.log('Looking for user with email:', email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    console.log('User found:', user.email, 'Active:', user.isActive, 'Role:', user.role);
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }
    
    // Verify password
    console.log('Verifying password for user:', user.email);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password verification failed');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    
    console.log(`${user.role} login successful:`, { email: user.email, role: user.role });
    
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
    console.error('Login error:', error);
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
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
    console.error('Auth verification error:', error);
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
  console.error('Error:', err);
  
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
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
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
  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN || 
                  process.env.RAILWAY_STATIC_URL || 
                  `http://localhost:${PORT}`;
  console.log(`🌐 API Base URL: ${baseUrl}`);
  console.log(`🔐 Super Admin Login: ${baseUrl}/api/super-admin/login`);
  console.log(`📊 Dashboard Stats: ${baseUrl}/api/super-admin/stats`);
  console.log('');
  console.log('🔑 Super Admin Credentials:');
  console.log('   Email: Amenity@gmail.com');
  console.log('   Password: Amenity');
  console.log('');
  const frontendUrl = process.env.RAILWAY_PUBLIC_DOMAIN || 
                      process.env.RAILWAY_STATIC_URL || 
                      'http://localhost:3001';
  console.log(`📱 Frontend should connect to: ${frontendUrl}`);
  console.log('✅ Ready to accept requests!');
});

export default app;
