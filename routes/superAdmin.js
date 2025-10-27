import express from 'express';
import {
  verifyToken,
  verifySuperAdmin,
  authorizeRoles
} from '../middleware/auth.js';
import {
  superAdminLogin,
  getDashboardStats,
  getAllAdmins,
  getAdminAnalytics,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllUsers,
  createUser,
  getAllTeachers,
  createTeacher,
  getAllCourses,
  createCourse,
  getAnalytics,
  getSubscriptions,
  exportData
} from '../controllers/superAdminController.js';

const router = express.Router();

// Public routes
router.post('/login', superAdminLogin);

// Protected routes - require super admin authentication
router.use(verifyToken);
router.use(verifySuperAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// Admin Management
router.get('/admins', getAllAdmins);
router.get('/admins/:adminId/analytics', getAdminAnalytics);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);

// User Management (Global)
router.get('/users', getAllUsers);
router.post('/users', createUser);

// Teacher Management (Global)
router.get('/teachers', getAllTeachers);
router.post('/teachers', createTeacher);

// Course Management (Global)
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);

// Analytics & Reports
router.get('/subscriptions', getSubscriptions);
router.get('/export', exportData);

export default router;