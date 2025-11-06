import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

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

const fixAdmins = async () => {
  try {
    await connectDB();
    
    // Get all admins
    const admins = await User.find({ role: 'admin' });
    console.log('Found admins:', admins.length);
    
    // Activate all admins and set proper names
    for (const admin of admins) {
      let updateData = { isActive: true };
      
      // Set proper names based on email
      if (admin.email === 'ak@gmail.com') {
        updateData.fullName = 'Akhilesh';
      } else if (admin.email === 'amenityforge@gmail.com') {
        updateData.fullName = 'Admin User';
      }
      
      await User.findByIdAndUpdate(admin._id, updateData);
      console.log('Updated admin:', admin.email, '- Name:', updateData.fullName, '- Active: true');
    }
    
    console.log('✅ All admins fixed!');
    
    // Show final status
    const updatedAdmins = await User.find({ role: 'admin' });
    for (const admin of updatedAdmins) {
      const studentCount = await User.countDocuments({ 
        role: 'student', 
        assignedAdmin: admin._id 
      });
      const teacherCount = await User.countDocuments({ 
        role: 'teacher', 
        assignedAdmin: admin._id 
      });
      console.log('Admin:', admin.email, '- Name:', admin.fullName, '- Active:', admin.isActive, '- Students:', studentCount, '- Teachers:', teacherCount);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

fixAdmins();








