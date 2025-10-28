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
    enum: ['student', 'teacher', 'admin', 'super-admin'],
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
  },
  permissions: {
    type: [String],
    default: []
  },
  details: {
    type: String,
    default: ''
  },
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
}, {
  timestamps: true
});

// Index for better performance
userSchema.index({ role: 1 });
userSchema.index({ assignedAdmin: 1 });
userSchema.index({ role: 1, assignedAdmin: 1 }); // Compound index for role + admin queries

export default mongoose.model('User', userSchema);
