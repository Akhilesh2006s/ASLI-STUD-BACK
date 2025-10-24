import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  },
  learningPathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath'
  },
  completed: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  progress: {
    type: Number, // percentage
    min: 0,
    max: 100,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for better performance
userProgressSchema.index({ userId: 1, videoId: 1 });
userProgressSchema.index({ userId: 1, assessmentId: 1 });
userProgressSchema.index({ userId: 1, learningPathId: 1 });
userProgressSchema.index({ userId: 1, completed: 1 });

export default mongoose.model('UserProgress', userProgressSchema);

