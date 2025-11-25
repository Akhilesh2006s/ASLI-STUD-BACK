import mongoose from 'mongoose';
import ExamResult from './models/ExamResult.js';
import User from './models/User.js';
import Exam from './models/Exam.js';

// MongoDB connection - must be set in .env
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in environment variables!');
  process.exit(1);
}

async function createTestExamResults() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Get admin and some students
    const admin = await User.findOne({ email: 'learner@example.com' });
    const students = await User.find({ role: 'student', assignedAdmin: admin._id }).limit(5);
    const exam = await Exam.findOne({ title: 'Advanced' });

    if (!admin || students.length === 0 || !exam) {
      console.log('❌ Missing data:', { admin: !!admin, students: students.length, exam: !!exam });
      return;
    }

    console.log(`\n🎯 Creating test exam results for admin: ${admin.fullName}`);
    console.log(`📝 Using exam: ${exam.title}`);
    console.log(`👥 Creating results for ${students.length} students`);

    // Create test exam results with different scores
    const testResults = [
      { student: students[0], score: 95, correct: 3, total: 3 },
      { student: students[1], score: 87, correct: 2, total: 3 },
      { student: students[2], score: 78, correct: 2, total: 3 },
      { student: students[3], score: 92, correct: 3, total: 3 },
      { student: students[4], score: 65, correct: 2, total: 3 }
    ];

    for (const testResult of testResults) {
      const resultData = {
        examId: exam._id,
        userId: testResult.student._id,
        adminId: admin._id,
        examTitle: exam.title,
        totalQuestions: testResult.total,
        correctAnswers: testResult.correct,
        wrongAnswers: testResult.total - testResult.correct,
        unattempted: 0,
        totalMarks: exam.totalMarks,
        obtainedMarks: Math.round((testResult.score / 100) * exam.totalMarks),
        percentage: testResult.score,
        timeTaken: Math.floor(Math.random() * 3600) + 1800, // 30-90 minutes
        subjectWiseScore: {
          maths: { correct: testResult.correct, total: testResult.total, marks: Math.round((testResult.score / 100) * exam.totalMarks) },
          physics: { correct: 0, total: 0, marks: 0 },
          chemistry: { correct: 0, total: 0, marks: 0 }
        },
        answers: {},
        completedAt: new Date()
      };

      const examResult = new ExamResult(resultData);
      await examResult.save();
      
      console.log(`✅ Created result for ${testResult.student.fullName}: ${testResult.score}%`);
    }

    console.log('\n🎉 Test exam results created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating test exam results:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTestExamResults();






