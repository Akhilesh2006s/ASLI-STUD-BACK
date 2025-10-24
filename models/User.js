import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  classNumber: {
    type: String,
    default: 'Unassigned'
  },
  phone: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better performance
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);
