import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not set in environment variables!');
      process.exit(1);
    }
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const showAdminData = async () => {
  try {
    await connectDB();
    
    // Get all admins
    const admins = await User.find({ role: 'admin' });
    console.log(`\n📊 Found ${admins.length} admins in the system:\n`);
    
    for (const admin of admins) {
      console.log(`👤 Admin: ${admin.fullName} (${admin.email})`);
      console.log(`   Status: ${admin.isActive ? '✅ Active' : '❌ Inactive'}`);
      
      // Count students assigned to this admin
      const studentCount = await User.countDocuments({
        role: 'student',
        assignedAdmin: admin._id
      });
      
      // Count teachers assigned to this admin
      const teacherCount = await User.countDocuments({
        role: 'teacher',
        assignedAdmin: admin._id
      });
      
      console.log(`   📚 Students: ${studentCount}`);
      console.log(`   👨‍🏫 Teachers: ${teacherCount}`);
      
      // Show some sample students
      if (studentCount > 0) {
        const sampleStudents = await User.find({
          role: 'student',
          assignedAdmin: admin._id
        }).limit(3).select('fullName email');
        
        console.log(`   📋 Sample Students:`);
        sampleStudents.forEach(student => {
          console.log(`      - ${student.fullName} (${student.email})`);
        });
        if (studentCount > 3) {
          console.log(`      ... and ${studentCount - 3} more students`);
        }
      }
      
      // Show some sample teachers
      if (teacherCount > 0) {
        const sampleTeachers = await User.find({
          role: 'teacher',
          assignedAdmin: admin._id
        }).limit(3).select('fullName email');
        
        console.log(`   👨‍🏫 Sample Teachers:`);
        sampleTeachers.forEach(teacher => {
          console.log(`      - ${teacher.fullName} (${teacher.email})`);
        });
        if (teacherCount > 3) {
          console.log(`      ... and ${teacherCount - 3} more teachers`);
        }
      }
      
      console.log(`   📈 Total Users: ${studentCount + teacherCount}`);
      console.log('   ' + '─'.repeat(50));
    }
    
    console.log(`\n🎯 Summary:`);
    console.log(`   Total Admins: ${admins.length}`);
    
    const totalStudents = await User.countDocuments({ role: 'student', assignedAdmin: { $exists: true } });
    const totalTeachers = await User.countDocuments({ role: 'teacher', assignedAdmin: { $exists: true } });
    const unassignedStudents = await User.countDocuments({ role: 'student', assignedAdmin: { $exists: false } });
    const unassignedTeachers = await User.countDocuments({ role: 'teacher', assignedAdmin: { $exists: false } });
    
    console.log(`   Total Assigned Students: ${totalStudents}`);
    console.log(`   Total Assigned Teachers: ${totalTeachers}`);
    console.log(`   Unassigned Students: ${unassignedStudents}`);
    console.log(`   Unassigned Teachers: ${unassignedTeachers}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

showAdminData();








