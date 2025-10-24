import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
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
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  role: {
    type: String,
    enum: ['teacher'],
    default: 'teacher'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  phone: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  qualifications: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better performance
teacherSchema.index({ role: 1 });
teacherSchema.index({ subjects: 1 });

export default mongoose.model('Teacher', teacherSchema);

