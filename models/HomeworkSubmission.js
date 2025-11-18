import mongoose from 'mongoose';

const homeworkSubmissionSchema = new mongoose.Schema({
  homeworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  submissionLink: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isMarkedAsDone: {
    type: Boolean,
    default: true // Automatically marked as done when submitted
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: {
    type: Date
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
homeworkSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true }); // One submission per student per homework
homeworkSubmissionSchema.index({ studentId: 1, submittedAt: -1 });
homeworkSubmissionSchema.index({ homeworkId: 1 });

export default mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);

