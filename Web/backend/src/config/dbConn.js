const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log(process.env.DATABASE_URI);
        const conn = await mongoose.connect(process.env.DATABASE_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};
module.exports = connectDB;