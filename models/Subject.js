import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['JEE', 'NEET', 'UPSC', 'GATE', 'SSC', 'Other']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  },
  duration: {
    type: String,
    required: true
  },
  subjects: [{
    type: String,
    required: true
  }],
  color: {
    type: String,
    default: 'bg-blue-100 text-blue-600'
  },
  icon: {
    type: String,
    default: 'BookOpen'
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  quizzes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  students: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Subject', subjectSchema);