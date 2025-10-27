import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://akhileshsamayamanthula:rxvIPIT4Bzobk9Ne@cluster0.4ej8ne2.mongodb.net/EDU-AI?retryWrites=true&w=majority&appName=Cluster0';
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

// Assign users to admins
const assignUsersToAdmins = async () => {
  try {
    await connectDB();

    // Get all admins
    const admins = await User.find({ role: 'admin' });
    console.log(`Found ${admins.length} admins`);

    if (admins.length === 0) {
      console.log('No admins found. Please create some admins first.');
      return;
    }

    // Get all students
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students`);

    // Get all teachers
    const teachers = await User.find({ role: 'teacher' });
    console.log(`Found ${teachers.length} teachers`);

    // Assign students to admins (distribute evenly)
    if (students.length > 0) {
      for (let i = 0; i < students.length; i++) {
        const adminIndex = i % admins.length;
        await User.findByIdAndUpdate(students[i]._id, {
          assignedAdmin: admins[adminIndex]._id
        });
        console.log(`Assigned student ${students[i].fullName} to admin ${admins[adminIndex].fullName}`);
      }
    }

    // Assign teachers to admins (distribute evenly)
    if (teachers.length > 0) {
      for (let i = 0; i < teachers.length; i++) {
        const adminIndex = i % admins.length;
        await User.findByIdAndUpdate(teachers[i]._id, {
          assignedAdmin: admins[adminIndex]._id
        });
        console.log(`Assigned teacher ${teachers[i].fullName} to admin ${admins[adminIndex].fullName}`);
      }
    }

    console.log('✅ User assignment completed!');
    
    // Show final counts
    for (const admin of admins) {
      const studentCount = await User.countDocuments({ 
        role: 'student', 
        assignedAdmin: admin._id 
      });
      const teacherCount = await User.countDocuments({ 
        role: 'teacher', 
        assignedAdmin: admin._id 
      });
      console.log(`Admin ${admin.fullName}: ${studentCount} students, ${teacherCount} teachers`);
    }

  } catch (error) {
    console.error('Error assigning users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the assignment
assignUsersToAdmins();
