import mongoose from 'mongoose';
import ExamResult from './models/ExamResult.js';
import User from './models/User.js';

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://akhileshsamayamanthula:rxvIPIT4Bzobk9Ne@cluster0.4ej8ne2.mongodb.net/EDU-AI?retryWrites=true&w=majority&appName=Cluster0';

async function checkExamResults() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Check exam results
    const examResults = await ExamResult.find().populate('userId', 'fullName email').populate('adminId', 'fullName email');
    console.log(`\n📊 Total Exam Results: ${examResults.length}`);
    
    if (examResults.length > 0) {
      console.log('\n🎯 Exam Results Details:');
      examResults.forEach((result, index) => {
        console.log(`${index + 1}. Student: ${result.userId?.fullName || 'Unknown'} (${result.userId?.email || 'No email'})`);
        console.log(`   Admin: ${result.adminId?.fullName || 'Unknown'} (${result.adminId?.email || 'No email'})`);
        console.log(`   Exam: ${result.examTitle}`);
        console.log(`   Score: ${result.obtainedMarks}/${result.totalMarks} (${result.percentage}%)`);
        console.log(`   Correct: ${result.correctAnswers}/${result.totalQuestions}`);
        console.log(`   Date: ${result.completedAt}`);
        console.log('   ---');
      });
      
      // Calculate top scorers
      console.log('\n🏆 Top Scorers by Admin:');
      const adminGroups = {};
      examResults.forEach(result => {
        const adminId = result.adminId._id.toString();
        if (!adminGroups[adminId]) {
          adminGroups[adminId] = [];
        }
        adminGroups[adminId].push(result);
      });
      
      Object.entries(adminGroups).forEach(([adminId, results]) => {
        const admin = results[0].adminId;
        console.log(`\nAdmin: ${admin.fullName} (${admin.email})`);
        
        // Group by student
        const studentGroups = {};
        results.forEach(result => {
          const studentId = result.userId._id.toString();
          if (!studentGroups[studentId]) {
            studentGroups[studentId] = {
              student: result.userId,
              totalMarks: 0,
              totalPossibleMarks: 0,
              examCount: 0,
              results: []
            };
          }
          studentGroups[studentId].totalMarks += result.obtainedMarks;
          studentGroups[studentId].totalPossibleMarks += result.totalMarks;
          studentGroups[studentId].examCount += 1;
          studentGroups[studentId].results.push(result);
        });
        
        // Calculate average scores
        Object.values(studentGroups).forEach(student => {
          student.averageScore = student.totalPossibleMarks > 0 
            ? (student.totalMarks / student.totalPossibleMarks * 100).toFixed(1)
            : 0;
        });
        
        // Sort by average score
        const topStudents = Object.values(studentGroups)
          .sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore))
          .slice(0, 3);
        
        topStudents.forEach((student, index) => {
          console.log(`  ${index + 1}. ${student.student.fullName}: ${student.averageScore}% (${student.examCount} exams)`);
        });
      });
      
    } else {
      console.log('❌ No exam results found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking exam results:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkExamResults();
