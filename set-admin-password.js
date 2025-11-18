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

const setAdminPassword = async () => {
  try {
    await connectDB();
    
    // Set password for ak@gmail.com admin
    const newPassword = 'Akhilesh123'; // Simple password you can remember
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const admin = await User.findOneAndUpdate(
      { email: 'ak@gmail.com' },
      { password: hashedPassword },
      { new: true }
    );
    
    if (admin) {
      console.log('✅ Password set for ak@gmail.com');
      console.log('Email: ak@gmail.com');
      console.log('Password: Akhilesh123');
      console.log('You can now login with these credentials!');
    } else {
      console.log('❌ Admin not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

setAdminPassword();








