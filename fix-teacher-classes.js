import mongoose from 'mongoose';
import Teacher from './models/Teacher.js';

const MONGODB_URI = 'mongodb+srv://ak26:ak26@cluster0.4qjqj.mongodb.net/asli-learn?retryWrites=true&w=majority';

async function fixTeacherClasses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const teacher = await Teacher.findById('690092a04c5f409f61927102');
    console.log('Teacher found:', teacher ? 'Yes' : 'No');
    console.log('Current assignedClassIds:', teacher?.assignedClassIds);
    
    // Add some test classes
    await Teacher.findByIdAndUpdate('690092a04c5f409f61927102', {
      assignedClassIds: ['Class-10', 'Class-12']
    });
    
    console.log('Added test classes: Class-10, Class-12');
    
    const updatedTeacher = await Teacher.findById('690092a04c5f409f61927102');
    console.log('Updated assignedClassIds:', updatedTeacher?.assignedClassIds);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixTeacherClasses();
