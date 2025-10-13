const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log(process.env.DATABASE_URI);
        const conn = await mongoose.connect(process.env.DATABASE_URI, {
            ssl: true,
            tls: true,
            tlsAllowInvalidCertificates: false,
            tlsAllowInvalidHostnames: false,
            serverSelectionTimeoutMS: 10000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.error('Please check:');
        console.error('1. Your IP is whitelisted in MongoDB Atlas (0.0.0.0/0 for all IPs)');
        console.error('2. Your database credentials are correct');
        console.error('3. Your internet connection is stable');
        process.exit(1);
    }
};
module.exports = connectDB;