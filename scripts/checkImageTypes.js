require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('../models/Image');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atmamanthan', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB Connected');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkTypes = async () => {
  await connectDB();
  
  // Get a sample of problematic images
  const problematic = await Image.find({
    $or: [
      { fileName: { $regex: /^image /i } },
      { filePath: { $regex: /image \d+\.png/i } }
    ]
  }).limit(10);
  
  console.log('Sample problematic images:');
  problematic.forEach(img => {
    console.log(`ID: ${img._id}`);
    console.log(`  Category: ${img.category}`);
    console.log(`  AgeGroup: ${img.ageGroup}`);
    console.log(`  Type: ${img.type}`);
    console.log(`  FileName: ${img.fileName}`);
    console.log(`  FilePath: ${img.filePath}`);
    console.log(`  DisplayOrder: ${img.displayOrder}`);
    console.log('---');
  });
  
  // Count by type
  const typeCounts = await Image.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  console.log('\nType distribution:');
  typeCounts.forEach(t => console.log(`  ${t._id}: ${t.count}`));
  
  await mongoose.connection.close();
  process.exit(0);
};

checkTypes().catch(console.error);

