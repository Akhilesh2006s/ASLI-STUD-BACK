import jwt from 'jsonwebtoken';

// Enhanced middleware to verify JWT token and extract user info
export const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    req.userId = decoded.userId || decoded.id; // Handle different JWT structures
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

// Middleware to check if user is super admin
export const verifySuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Super admin required.' });
  }
  next();
};

// Middleware to check if user is teacher
export const verifyTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Access denied. Teacher privileges required.' });
  }
  next();
};

// Enhanced middleware to extract teacher ID and add to request
export const extractTeacherId = (req, res, next) => {
  if (req.user.role === 'teacher') {
    req.teacherId = req.userId;
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Teacher privileges required.' });
  }
  next();
};

// Enhanced middleware to extract admin ID and add to request
export const extractAdminId = (req, res, next) => {
  if (req.user.role === 'admin') {
    req.adminId = req.userId;
  } else if (req.user.role === 'super-admin') {
    // Super admin can access all data, so we don't set adminId filter
    req.adminId = null;
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Middleware to ensure admin can only access their own data
export const verifyAdminOwnership = (req, res, next) => {
  if (req.user.role === 'admin') {
    req.adminId = req.userId;
  } else if (req.user.role === 'super-admin') {
    // Super admin can access all data
    req.adminId = null;
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Role-based authorization middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

// Middleware to check if user can access specific admin's data
export const canAccessAdminData = (req, res, next) => {
  const { adminId } = req.params;
  
  if (req.user.role === 'super-admin') {
    // Super admin can access any admin's data
    req.targetAdminId = adminId;
    return next();
  }
  
  if (req.user.role === 'admin' && req.userId === adminId) {
    // Admin can only access their own data
    req.targetAdminId = adminId;
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. You can only access your own data.' 
  });
};

// Middleware to ensure data ownership for CRUD operations
export const verifyDataOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const document = await Model.findById(id);
      
      if (!document) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }
      
      // Super admin can access all data
      if (req.user.role === 'super-admin') {
        return next();
      }
      
      // Admin can only access their own data
      if (req.user.role === 'admin') {
        if (document.adminId && document.adminId.toString() !== req.userId) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied. You can only access your own data.' 
          });
        }
      }
      
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
};

// Middleware to add adminId to request body for creation operations
export const addAdminIdToBody = (req, res, next) => {
  if (req.user.role === 'admin') {
    req.body.adminId = req.userId;
  }
  next();
};

