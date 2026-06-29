const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techiegram');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n⚠️  WARNING: Could not connect to MongoDB (${error.message}).`);
    console.error(`   Please ensure MongoDB is running or provide a valid MONGODB_URI in your .env file.\n`);
  }
};

module.exports = connectDB;
