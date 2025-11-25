import mongoose from 'mongoose';
import Exam from './models/Exam.js';
import Question from './models/Question.js';
import User from './models/User.js';

// MongoDB connection - must be set in .env
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in environment variables!');
  process.exit(1);
}

async function checkExams() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Check exams
    const exams = await Exam.find().populate('createdBy', 'fullName email');
    console.log(`\n📝 Total Exams: ${exams.length}`);
    
    if (exams.length > 0) {
      console.log('\n📋 Exam Details:');
      exams.forEach((exam, index) => {
        console.log(`${index + 1}. Title: ${exam.title}`);
        console.log(`   Description: ${exam.description}`);
        console.log(`   Type: ${exam.examType}`);
        console.log(`   Duration: ${exam.duration} minutes`);
        console.log(`   Total Questions: ${exam.totalQuestions}`);
        console.log(`   Total Marks: ${exam.totalMarks}`);
        console.log(`   Is Active: ${exam.isActive}`);
        console.log(`   Created By: ${exam.createdBy?.fullName || 'Unknown'} (${exam.createdBy?.email || 'No email'})`);
        console.log(`   Admin ID: ${exam.adminId}`);
        console.log(`   Start Date: ${exam.startDate}`);
        console.log(`   End Date: ${exam.endDate}`);
        console.log('   ---');
      });
      
      // Check questions for each exam
      console.log('\n❓ Questions per Exam:');
      for (const exam of exams) {
        const questions = await Question.find({ exam: exam._id });
        console.log(`- ${exam.title}: ${questions.length} questions`);
      }
      
    } else {
      console.log('❌ No exams found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking exams:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkExams();
