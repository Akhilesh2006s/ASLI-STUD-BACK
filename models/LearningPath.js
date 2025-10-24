import mongoose from 'mongoose';

const learningPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subjectIds: [{
    type: String,
    required: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedHours: {
    type: Number,
    required: true
  },
  videoIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  enrolledUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes for better performance
learningPathSchema.index({ subjectIds: 1 });
learningPathSchema.index({ difficulty: 1 });
learningPathSchema.index({ isPublished: 1 });
learningPathSchema.index({ createdAt: -1 });

export default mongoose.model('LearningPath', learningPathSchema);

