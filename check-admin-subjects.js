import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import User from './models/User.js';
import Subject from './models/Subject.js';

// Connect to MongoDB - must be set in .env
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not set in environment variables!');
  process.exit(1);
}

async function checkAdminSubjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin by email
    const adminEmail = 'hi@gmail.com';
    const admin = await User.findOne({ email: adminEmail, role: 'admin' });

    if (!admin) {
      console.log(`❌ Admin with email ${adminEmail} not found`);
      process.exit(1);
    }

    console.log(`\n✅ Found Admin:`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.fullName || 'N/A'}`);
    console.log(`   Board: ${admin.board || 'Not assigned'}`);
    console.log(`   ID: ${admin._id}`);

    // Get all subjects for this admin's board
    const adminBoard = admin.board;
    
    if (!adminBoard) {
      console.log(`\n⚠️ Admin ${adminEmail} has no board assigned`);
      console.log(`   No subjects will be shown to students of this admin.`);
      process.exit(0);
    }

    const subjects = await Subject.find({ 
      board: adminBoard, 
      isActive: true 
    }).sort({ name: 1 });

    console.log(`\n📚 Active subjects for board "${adminBoard}":`);
    console.log(`   Total: ${subjects.length} subjects\n`);

    if (subjects.length === 0) {
      console.log('   No active subjects found for this board.');
    } else {
      subjects.forEach((subject, index) => {
        console.log(`   ${index + 1}. ${subject.name}`);
        console.log(`      ID: ${subject._id}`);
        console.log(`      Code: ${subject.code || 'N/A'}`);
        console.log(`      Description: ${subject.description || 'N/A'}`);
        console.log('');
      });
    }

    // Check ALL subjects for this board (including inactive)
    const allSubjects = await Subject.find({ 
      board: adminBoard
    }).sort({ name: 1 });

    console.log(`\n📚 ALL subjects for board "${adminBoard}" (including inactive):`);
    console.log(`   Total: ${allSubjects.length} subjects\n`);

    // Check subjects from ALL boards
    const allBoardsSubjects = await Subject.find({}).sort({ name: 1 });
    console.log(`\n📚 ALL subjects in database (all boards):`);
    console.log(`   Total: ${allBoardsSubjects.length} subjects\n`);
    
    // Group by board
    const byBoard = {};
    allBoardsSubjects.forEach(sub => {
      if (!byBoard[sub.board]) {
        byBoard[sub.board] = [];
      }
      byBoard[sub.board].push(sub.name);
    });
    
    Object.keys(byBoard).forEach(board => {
      console.log(`   ${board}: ${byBoard[board].length} subjects`);
      byBoard[board].forEach(name => console.log(`      - ${name}`));
    });

    // Also check teachers for this admin
    const Teacher = (await import('./models/Teacher.js')).default;
    const teachers = await Teacher.find({
      adminId: admin._id,
      isActive: true
    }).select('fullName email subjects');

    console.log(`\n👨‍🏫 Teachers for this admin: ${teachers.length}`);
    if (teachers.length > 0) {
      teachers.forEach((teacher, index) => {
        console.log(`   ${index + 1}. ${teacher.fullName} (${teacher.email})`);
        console.log(`      Teaching ${teacher.subjects?.length || 0} subjects`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminSubjects();

