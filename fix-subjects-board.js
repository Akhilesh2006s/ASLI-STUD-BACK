import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from './models/Subject.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not set in environment variables!');
  process.exit(1);
}

async function fixSubjectsBoard() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Fix subjects with undefined or wrong board
    const subjectsToFix = ['Maths', 'Samayamanthula', 'as'];
    const targetBoard = 'STATE_TS'; // Admin hi@gmail.com's board

    for (const subjectName of subjectsToFix) {
      const subject = await Subject.findOne({ name: subjectName });
      if (subject) {
        const oldBoard = subject.board || 'undefined';
        subject.board = targetBoard;
        subject.isActive = true;
        await subject.save();
        console.log(`✅ Fixed "${subjectName}": ${oldBoard} → ${targetBoard}`);
      } else {
        console.log(`❌ Subject "${subjectName}" not found`);
      }
    }

    console.log('\n✅ All subjects fixed!');
    
    // Show updated list
    const allSubjects = await Subject.find({ board: targetBoard, isActive: true }).sort({ name: 1 });
    console.log(`\n📚 Subjects for board ${targetBoard}: ${allSubjects.length}`);
    allSubjects.forEach((sub, idx) => {
      console.log(`   ${idx + 1}. ${sub.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixSubjectsBoard();


