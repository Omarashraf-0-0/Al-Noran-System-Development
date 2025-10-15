const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/user');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const users = await User.find({}).select('email fullName role').limit(5);
    
    console.log('📋 Users in database:');
    console.log('---');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.fullName}`);
      console.log(`   Role: ${user.role}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
