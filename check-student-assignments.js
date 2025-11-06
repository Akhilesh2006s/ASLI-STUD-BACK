import mongoose from 'mongoose';
import User from './models/User.js';

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://akhileshsamayamanthula:rxvIPIT4Bzobk9Ne@cluster0.4ej8ne2.mongodb.net/EDU-AI?retryWrites=true&w=majority&appName=Cluster0';

async function checkStudentAssignments() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Check admins
    const admins = await User.find({ role: 'admin' });
    console.log(`\n👑 Total Admins: ${admins.length}`);
    
    admins.forEach(admin => {
      console.log(`- ${admin.fullName} (${admin.email})`);
    });

    // Check students
    const students = await User.find({ role: 'student' });
    console.log(`\n🎓 Total Students: ${students.length}`);
    
    // Check student assignments
    const assignedStudents = students.filter(student => student.assignedAdmin);
    const unassignedStudents = students.filter(student => !student.assignedAdmin);
    
    console.log(`\n📊 Student Assignment Status:`);
    console.log(`- Assigned to Admin: ${assignedStudents.length}`);
    console.log(`- Not Assigned: ${unassignedStudents.length}`);
    
    if (assignedStudents.length > 0) {
      console.log(`\n🎯 Assigned Students:`);
      assignedStudents.forEach(student => {
        console.log(`- ${student.fullName} (${student.email}) -> Admin: ${student.assignedAdmin}`);
      });
    }
    
    if (unassignedStudents.length > 0) {
      console.log(`\n❌ Unassigned Students:`);
      unassignedStudents.forEach(student => {
        console.log(`- ${student.fullName} (${student.email})`);
      });
    }
    
    // Check students by admin
    console.log(`\n📈 Students by Admin:`);
    admins.forEach(async (admin) => {
      const adminStudents = await User.find({ role: 'student', assignedAdmin: admin._id });
      console.log(`- ${admin.fullName}: ${adminStudents.length} students`);
      if (adminStudents.length > 0) {
        adminStudents.forEach(student => {
          console.log(`  * ${student.fullName} (${student.email})`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking student assignments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkStudentAssignments();






