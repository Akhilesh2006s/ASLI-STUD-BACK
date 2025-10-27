import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: false
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number,
    required: true // in seconds
  },
  subjectId: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: false
  },
  youtubeUrl: {
    type: String,
    trim: true
  },
  isYouTubeVideo: {
    type: Boolean,
    default: false
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
videoSchema.index({ subjectId: 1 });
videoSchema.index({ difficulty: 1 });
videoSchema.index({ isPublished: 1 });
videoSchema.index({ isActive: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ adminId: 1 }); // Multi-tenant index
videoSchema.index({ adminId: 1, isActive: 1 }); // Compound index for student queries

export default mongoose.model('Video', videoSchema);
