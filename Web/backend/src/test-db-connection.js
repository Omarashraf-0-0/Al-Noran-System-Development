// Simple MongoDB connection test
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

console.log('Testing MongoDB Connection...');
console.log('Connection String:', process.env.DATABASE_URI?.replace(/\/\/.*:.*@/, '//<hidden>@'));

mongoose.connect(process.env.DATABASE_URI, {
    ssl: true,
    tls: true,
    serverSelectionTimeoutMS: 10000,
})
.then(() => {
    console.log('✅ SUCCESS! MongoDB Connected:', mongoose.connection.host);
    process.exit(0);
})
.catch((err) => {
    console.error('❌ FAILED! MongoDB Connection Error:');
    console.error('Error:', err.message);
    console.error('\nTroubleshooting:');
    console.error('1. Go to https://cloud.mongodb.com/');
    console.error('2. Network Access → Add IP Address → Allow Access From Anywhere');
    console.error('3. Wait 2 minutes and try again');
    console.error('\nYour IP:', '196.133.104.28');
    process.exit(1);
});
