import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validates required environment variables
 * Throws error if any required variable is missing
 */
export const validateEnv = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for production security');
  }

  // Validate MONGO_URI format
  if (!process.env.MONGO_URI.startsWith('mongodb://') && 
      !process.env.MONGO_URI.startsWith('mongodb+srv://')) {
    throw new Error('MONGO_URI must be a valid MongoDB connection string');
  }

  console.log('✅ Environment variables validated successfully');
};

export default validateEnv;

