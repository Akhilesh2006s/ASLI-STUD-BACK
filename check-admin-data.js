import mongoose from 'mongoose';
import User from './models/User.js';
import Teacher from './models/Teacher.js';

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cognilearn');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check and fix admin data
const checkAndFixAdmins = async () => {
  try {
    console.log('🔍 Checking admin records...');
    
    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    console.log(`Found ${admins.length} admin records`);
    
    for (const admin of admins) {
      console.log(`\n📋 Admin: ${admin.fullName || 'Unknown'}`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Email: ${admin.email || 'MISSING EMAIL'}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log(`   Created: ${admin.createdAt}`);
      
      // Check if email is missing or invalid
      if (!admin.email || admin.email.trim() === '') {
        console.log(`   ⚠️  WARNING: Admin ${admin.fullName} has no email!`);
        
        // You can uncomment the following lines to fix missing emails
        // const fixedEmail = `${admin.fullName?.toLowerCase().replace(/\s+/g, '.')}@admin.local`;
        // admin.email = fixedEmail;
        // await admin.save();
        // console.log(`   ✅ Fixed email: ${fixedEmail}`);
      }
    }
    
    // Check teachers
    console.log('\n👨‍🏫 Checking teacher records...');
    const teachers = await Teacher.find();
    console.log(`Found ${teachers.length} teacher records`);
    
    for (const teacher of teachers) {
      console.log(`\n📋 Teacher: ${teacher.fullName || 'Unknown'}`);
      console.log(`   ID: ${teacher._id}`);
      console.log(`   Email: ${teacher.email || 'MISSING EMAIL'}`);
      console.log(`   Admin ID: ${teacher.adminId || 'NO ADMIN ASSIGNED'}`);
      console.log(`   Active: ${teacher.isActive}`);
      
      if (!teacher.adminId) {
        console.log(`   ⚠️  WARNING: Teacher ${teacher.fullName} has no admin assigned!`);
      }
    }
    
    // Check students
    console.log('\n🎓 Checking student records...');
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} student records`);
    
    for (const student of students) {
      console.log(`\n📋 Student: ${student.fullName || 'Unknown'}`);
      console.log(`   ID: ${student._id}`);
      console.log(`   Email: ${student.email || 'MISSING EMAIL'}`);
      console.log(`   Assigned Admin: ${student.assignedAdmin || 'NO ADMIN ASSIGNED'}`);
      console.log(`   Class: ${student.classNumber || 'N/A'}`);
      
      if (!student.assignedAdmin) {
        console.log(`   ⚠️  WARNING: Student ${student.fullName} has no admin assigned!`);
      }
    }
    
    console.log('\n✅ Admin data check completed!');
    
  } catch (error) {
    console.error('Error checking admin data:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkAndFixAdmins();
  await mongoose.disconnect();
  console.log('\n🔌 Database disconnected');
};

// Run the script
main().catch(console.error);


