require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atmamanthan');
    console.log('Connected to MongoDB');

    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log('Admin already exists. Use login endpoint to authenticate.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const admin = new Admin({ username, password });
    await admin.save();

    console.log('✓ Admin created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();

