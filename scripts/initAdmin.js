require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const initAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atmamanthan');
    console.log('Connected to MongoDB');

    const username = await question('Enter admin username: ');
    const password = await question('Enter admin password: ');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log('Admin already exists. Use login endpoint to authenticate.');
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    const admin = new Admin({ username, password });
    await admin.save();

    console.log('✓ Admin created successfully!');
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  }
};

initAdmin();

