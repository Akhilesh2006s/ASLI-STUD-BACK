import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate Super Admin token
export const generateSuperAdminToken = (userData) => {
  const payload = {
    id: userData.id || 'super-admin-001',
    email: userData.email,
    fullName: userData.fullName || 'Super Admin',
    role: 'super-admin'
  };
  
  return generateToken(payload);
};

// Generate Admin token
export const generateAdminToken = (userData) => {
  const payload = {
    id: userData._id,
    email: userData.email,
    fullName: userData.fullName,
    role: userData.role,
    permissions: userData.permissions || []
  };
  
  return generateToken(payload);
};

// Generate User token
export const generateUserToken = (userData) => {
  const payload = {
    id: userData._id,
    email: userData.email,
    fullName: userData.fullName,
    role: userData.role
  };
  
  return generateToken(payload);
};

// Decode token without verification (for debugging)
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get token expiration time
export const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

export { JWT_SECRET, JWT_EXPIRES_IN };


