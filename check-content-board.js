import mongoose from 'mongoose';
import Content from './models/Content.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkContentBoard() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://akhileshsamayamanthula:rxvIPIT4Bzobk9Ne@cluster0.4ej8ne2.mongodb.net/EDU-AI?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Check all contents
    const allContents = await Content.find({}).limit(10);
    console.log('============================================================');
    console.log('ALL CONTENT ITEMS');
    console.log('============================================================');
    console.log(`Total content items: ${allContents.length}\n`);
    
    allContents.forEach((content, idx) => {
      console.log(`${idx + 1}. ${content.title}`);
      console.log(`   Board: ${content.board}`);
      console.log(`   Type: ${content.type}`);
      console.log(`   Subject: ${content.subject}`);
      console.log(`   IsActive: ${content.isActive}`);
      console.log(`   IsExclusive: ${content.isExclusive}`);
      console.log('');
    });

    // Check STATE_TS contents specifically
    const stateTsContents = await Content.find({ board: 'STATE_TS' });
    console.log('============================================================');
    console.log('STATE_TS CONTENT ITEMS');
    console.log('============================================================');
    console.log(`Found ${stateTsContents.length} items for STATE_TS board\n`);
    
    stateTsContents.forEach((content, idx) => {
      console.log(`${idx + 1}. ${content.title}`);
      console.log(`   Board: ${content.board}`);
      console.log(`   Type: ${content.type}`);
      console.log(`   IsActive: ${content.isActive}`);
      console.log(`   IsExclusive: ${content.isExclusive}`);
      console.log('');
    });

    // Check students with STATE_TS board
    const stateTsStudents = await User.find({ role: 'student', board: 'STATE_TS' }).limit(5);
    console.log('============================================================');
    console.log('STUDENTS WITH STATE_TS BOARD');
    console.log('============================================================');
    console.log(`Found ${stateTsStudents.length} students\n`);
    
    stateTsStudents.forEach((student, idx) => {
      console.log(`${idx + 1}. ${student.email}`);
      console.log(`   Board: ${student.board}`);
      console.log(`   Assigned Admin: ${student.assignedAdmin}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error checking content board:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkContentBoard();


