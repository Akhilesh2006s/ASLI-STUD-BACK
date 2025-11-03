import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    enum: ['CBSE_AP', 'CBSE_TS', 'STATE_AP', 'STATE_TS'],
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
boardSchema.index({ code: 1 });
boardSchema.index({ isActive: 1 });

export default mongoose.model('Board', boardSchema);


