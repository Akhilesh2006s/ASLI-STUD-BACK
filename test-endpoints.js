import mongoose from 'mongoose';
import User from './models/User.js';
import Video from './models/Video.js';
import Teacher from './models/Teacher.js';
import Assessment from './models/Assessment.js';
import Exam from './models/Exam.js';
import ExamResult from './models/ExamResult.js';

// MongoDB connection - must be set in .env
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in environment variables!');
  process.exit(1);
}

async function testDatabaseConnection() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Test each model
    console.log('\n🔍 Testing model counts...');
    
    const totalUsers = await User.countDocuments();
    console.log(`✅ Total Users: ${totalUsers}`);
    
    const totalTeachers = await Teacher.countDocuments();
    console.log(`✅ Total Teachers: ${totalTeachers}`);
    
    const totalVideos = await Video.countDocuments();
    console.log(`✅ Total Videos: ${totalVideos}`);
    
    const totalAssessments = await Assessment.countDocuments();
    console.log(`✅ Total Assessments: ${totalAssessments}`);
    
    const totalExams = await Exam.countDocuments();
    console.log(`✅ Total Exams: ${totalExams}`);
    
    const totalExamResults = await ExamResult.countDocuments();
    console.log(`✅ Total Exam Results: ${totalExamResults}`);
    
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    console.log(`✅ Total Admins: ${totalAdmins}`);
    
    const totalStudents = await User.countDocuments({ role: 'student' });
    console.log(`✅ Total Students: ${totalStudents}`);

    console.log('\n🎉 All database queries successful!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testDatabaseConnection();






