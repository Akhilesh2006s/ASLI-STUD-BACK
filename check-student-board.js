import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const studentEmail = 'hi@gmail.com'; // Change this to the actual student email

async function checkStudentBoard() {
  try {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://akhileshsamayamanthula:rxvIPIT4Bzobk9Ne@cluster0.4ej8ne2.mongodb.net/EDU-AI?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Find the student
    const student = await User.findOne({ email: studentEmail.toLowerCase() }).select('email fullName role board assignedAdmin');
    
    console.log('============================================================');
    console.log('STUDENT INFORMATION');
    console.log('============================================================');
    
    if (!student) {
      console.log(`❌ Student with email ${studentEmail} not found.`);
    } else {
      console.log(`Email: ${student.email}`);
      console.log(`Full Name: ${student.fullName}`);
      console.log(`Role: ${student.role}`);
      console.log(`Board: ${student.board || '❌ NOT ASSIGNED'}`);
      console.log(`Assigned Admin: ${student.assignedAdmin}`);
      
      // Check the admin's board
      if (student.assignedAdmin) {
        const admin = await User.findById(student.assignedAdmin).select('email fullName role board schoolName');
        if (admin) {
          console.log('\n============================================================');
          console.log('ASSIGNED ADMIN INFORMATION');
          console.log('============================================================');
          console.log(`Admin Email: ${admin.email}`);
          console.log(`Admin Name: ${admin.fullName}`);
          console.log(`Admin Board: ${admin.board || '❌ NOT ASSIGNED'}`);
          console.log(`School Name: ${admin.schoolName || 'Not set'}`);
          
          if (admin.board && !student.board) {
            console.log('\n⚠️  STUDENT BOARD MISMATCH:');
            console.log(`   Student needs board: ${admin.board} (inherited from admin)`);
            console.log(`   Student currently has: ${student.board || 'null'}`);
          }
        }
      }
    }
    
    // Check all students with different board values
    console.log('\n============================================================');
    console.log('ALL STUDENTS - BOARD DISTRIBUTION');
    console.log('============================================================');
    const allStudents = await User.find({ role: 'student' }).select('email board assignedAdmin').limit(10);
    console.log(`Total students checked: ${allStudents.length}\n`);
    
    allStudents.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.email}`);
      console.log(`   Board: ${s.board || 'null'}`);
      console.log(`   Assigned Admin: ${s.assignedAdmin || 'null'}`);
    });

  } catch (error) {
    console.error('Error checking student board:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkStudentBoard();


