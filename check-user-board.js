import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const email = 'hi@gmail.com';

async function checkUserBoard() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://akhileshsamayamanthula:rxvIPIT4Bzobk9Ne@cluster0.4ej8ne2.mongodb.net/EDU-AI?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('email fullName role board schoolName assignedAdmin assignedTeacher');

    if (!user) {
      console.log(`\n❌ User with email "${email}" not found in the database.`);
      process.exit(0);
    }

    console.log('\n' + '='.repeat(60));
    console.log('USER INFORMATION');
    console.log('='.repeat(60));
    console.log(`Email: ${user.email}`);
    console.log(`Full Name: ${user.fullName}`);
    console.log(`Role: ${user.role}`);
    console.log(`Board: ${user.board || '❌ NOT ASSIGNED'}`);
    
    if (user.role === 'admin') {
      console.log(`School Name: ${user.schoolName || 'Not set'}`);
    }
    
    if (user.role === 'student') {
      console.log(`Assigned Admin: ${user.assignedAdmin || 'Not assigned'}`);
      console.log(`Assigned Teacher: ${user.assignedTeacher || 'Not assigned'}`);
    }
    
    console.log('='.repeat(60));
    
    if (user.board) {
      const boardNames = {
        'CBSE_AP': 'CBSE Andhra Pradesh',
        'CBSE_TS': 'CBSE Telangana State',
        'STATE_AP': 'State Andhra Pradesh',
        'STATE_TS': 'State Telangana State'
      };
      console.log(`\n✅ Board: ${boardNames[user.board] || user.board}`);
    } else {
      console.log(`\n⚠️  This user does not have a board assigned.`);
      console.log(`   For students: Board is inherited from their assigned admin.`);
      console.log(`   For admins: Board should be set when creating the admin account.`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserBoard();

