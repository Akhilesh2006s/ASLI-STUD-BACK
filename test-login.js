import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

const testLogin = async () => {
  try {
    await connectDB();
    
    const admin = await User.findOne({ email: 'ak@gmail.com' });
    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }
    
    console.log('Admin found:', admin.email);
    console.log('Admin active:', admin.isActive);
    console.log('Admin role:', admin.role);
    console.log('Admin name:', admin.fullName);
    
    // Test password verification
    const testPassword = 'Akhilesh123';
    const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
    console.log('Password valid:', isPasswordValid);
    
    if (isPasswordValid) {
      console.log('✅ Login should work!');
    } else {
      console.log('❌ Password verification failed');
      console.log('Setting new password...');
      const newPassword = 'Akhilesh123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(admin._id, { password: hashedPassword });
      console.log('✅ Password reset complete');
      
      // Test again
      const isPasswordValidAfter = await bcrypt.compare(testPassword, hashedPassword);
      console.log('Password valid after reset:', isPasswordValidAfter);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testLogin();







