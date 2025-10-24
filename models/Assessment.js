import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer'],
    default: 'multiple-choice'
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  explanation: {
    type: String
  },
  points: {
    type: Number,
    default: 1
  }
});

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [questionSchema],
  subjectIds: [{
    type: String,
    required: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: {
    type: Number,
    required: true // in minutes
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  attempts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
    answers: [mongoose.Schema.Types.Mixed],
    completedAt: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: false
  },
  driveLink: {
    type: String,
    trim: true
  },
  isDriveQuiz: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
assessmentSchema.index({ subjectIds: 1 });
assessmentSchema.index({ difficulty: 1 });
assessmentSchema.index({ isPublished: 1 });
assessmentSchema.index({ createdAt: -1 });

export default mongoose.model('Assessment', assessmentSchema);
