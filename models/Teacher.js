import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  subjects: [{
    type: String,
    trim: true
  }],
  qualifications: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    default: 0
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: [{
    type: String,
    enum: ['create_content', 'manage_students', 'view_analytics', 'create_exams']
  }],
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
teacherSchema.index({ email: 1 });
teacherSchema.index({ adminId: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ isActive: 1 });

export default mongoose.model('Teacher', teacherSchema);