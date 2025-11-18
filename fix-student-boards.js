import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixStudentBoards() {
  try {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://akhileshsamayamanthula:rxvIPIT4Bzobk9Ne@cluster0.4ej8ne2.mongodb.net/EDU-AI?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Find all students without a board
    const studentsWithoutBoard = await User.find({
      role: 'student',
      $or: [
        { board: null },
        { board: { $exists: false } }
      ]
    }).select('email fullName assignedAdmin board');

    console.log('============================================================');
    console.log('FIXING STUDENT BOARDS');
    console.log('============================================================');
    console.log(`Found ${studentsWithoutBoard.length} students without board\n`);

    let fixed = 0;
    let notFixed = 0;

    for (const student of studentsWithoutBoard) {
      if (student.assignedAdmin) {
        const admin = await User.findById(student.assignedAdmin).select('board');
        if (admin && admin.board) {
          await User.findByIdAndUpdate(
            student._id,
            { board: admin.board },
            { runValidators: false }
          );
          console.log(`✅ ${student.email} -> ${admin.board}`);
          fixed++;
        } else {
          console.log(`❌ ${student.email} -> Admin has no board`);
          notFixed++;
        }
      } else {
        console.log(`❌ ${student.email} -> No assigned admin`);
        notFixed++;
      }
    }

    console.log('\n============================================================');
    console.log('SUMMARY');
    console.log('============================================================');
    console.log(`Fixed: ${fixed}`);
    console.log(`Not Fixed: ${notFixed}`);
    console.log(`Total: ${studentsWithoutBoard.length}`);

  } catch (error) {
    console.error('Error fixing student boards:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixStudentBoards();



