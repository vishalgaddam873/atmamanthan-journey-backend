require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Image = require('../models/Image');

// Connect to database
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

// Fix image paths and filenames
const fixImagePaths = async () => {
  await connectDB();

  // Define folder mappings
  const folderMappings = {
    'Kids': {
      'POSITIVE': path.join(__dirname, '../assets/Kids/Positive'),
      'NEGATIVE': path.join(__dirname, '../assets/Kids/Negative'),
      'NEUTRAL': path.join(__dirname, '../assets/Kids/Neutral'),
    },
    'PreTeens': {
      'POSITIVE': path.join(__dirname, '../assets/PreTeens/Positive'),
      'NEGATIVE': path.join(__dirname, '../assets/PreTeens/Negative'),
      'NEUTRAL': path.join(__dirname, '../assets/PreTeens/Neutral'),
    },
    'TeenPlus': {
      'POSITIVE': path.join(__dirname, '../assets/TeenPlus/Positive'),
      'NEGATIVE': path.join(__dirname, '../assets/TeenPlus/Negative'),
      'NEUTRAL': path.join(__dirname, '../assets/TeenPlus/Neutral'),
    },
  };

  const ageGroupToFolder = {
    '4-9': 'Kids',
    '9-14': 'PreTeens',
    '15+': 'TeenPlus',
  };

  const typeToFolder = {
    'POS-EMOTION': 'Positive',
    'NEG-EMOTION': 'Negative',
  };

  console.log('🔍 Finding images with incorrect paths...\n');

  // Get all images
  const allImages = await Image.find({});
  let fixedCount = 0;
  let deletedCount = 0;
  let notFoundCount = 0;

  for (const image of allImages) {
    const { category, ageGroup, type, fileName, filePath, _id } = image;
    
    // Skip if fileName looks correct (contains the pattern like negative-preteens-1.png)
    if (fileName && !fileName.includes('image ') && !fileName.includes('Image ')) {
      continue;
    }

    // Determine which folder this image should be in
    const folderKey = ageGroupToFolder[ageGroup];
    if (!folderKey) {
      console.log(`⚠️  Unknown ageGroup: ${ageGroup} for image ${_id}`);
      continue;
    }
    
    // Debug: Check if folderKey exists in mappings
    if (!folderMappings[folderKey]) {
      console.log(`⚠️  Folder key '${folderKey}' not found in mappings for image ${_id} (ageGroup: ${ageGroup})`);
      continue;
    }

    // Determine folder based on category and type
    // POS-EMOTION always comes from Positive folder
    // NEG-EMOTION with category NEGATIVE comes from Negative folder
    // NEG-EMOTION with category NEUTRAL comes from Neutral folder
    // Note: folderMappings uses UPPERCASE keys
    let emotionFolder;
    if (type === 'POS-EMOTION') {
      emotionFolder = 'POSITIVE';
    } else if (type === 'NEG-EMOTION') {
      if (category === 'NEGATIVE') {
        emotionFolder = 'NEGATIVE';
      } else if (category === 'NEUTRAL') {
        emotionFolder = 'NEUTRAL';
      } else {
        console.log(`⚠️  Unknown category for NEG-EMOTION: ${category} for image ${_id}`);
        continue;
      }
    } else {
      console.log(`⚠️  Unknown type: ${type} for image ${_id}`);
      continue;
    }

    const targetFolder = folderMappings[folderKey]?.[emotionFolder];
    if (!targetFolder) {
      console.log(`⚠️  Target folder is undefined for image ${_id}`);
      console.log(`   folderKey: ${folderKey}, emotionFolder: ${emotionFolder}`);
      console.log(`   Available folders for ${folderKey}:`, Object.keys(folderMappings[folderKey] || {}));
      notFoundCount++;
      continue;
    }
    if (!fs.existsSync(targetFolder)) {
      console.log(`⚠️  Folder does not exist: ${targetFolder} for image ${_id}`);
      notFoundCount++;
      continue;
    }

    // List all files in the target folder
    const files = fs.readdirSync(targetFolder)
      .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
      .sort();

    // Try to find matching file by displayOrder
    // Extract number from old fileName if possible
    const oldNumberMatch = fileName?.match(/(\d+)/);
    const oldNumber = oldNumberMatch ? parseInt(oldNumberMatch[1]) : null;

    let matchedFile = null;
    
    if (oldNumber !== null) {
      // Try to find file with matching number (e.g., if old was "image 1.png", find file with "1" in name)
      matchedFile = files.find(file => {
        const fileNumberMatch = file.match(/(\d+)/);
        return fileNumberMatch && parseInt(fileNumberMatch[1]) === oldNumber;
      });
    }

    // If no match by number, try to match by position (displayOrder)
    if (!matchedFile && image.displayOrder !== undefined) {
      const targetIndex = image.displayOrder;
      if (targetIndex >= 0 && targetIndex < files.length) {
        matchedFile = files[targetIndex];
      }
    }

    if (!matchedFile) {
      console.log(`❌ Could not find matching file for image ${_id} (${fileName}) in ${targetFolder}`);
      console.log(`   Category: ${category}, AgeGroup: ${ageGroup}, Type: ${type}, DisplayOrder: ${image.displayOrder}`);
      console.log(`   Available files: ${files.join(', ')}`);
      
      // Delete the record if we can't find a match
      await Image.findByIdAndDelete(_id);
      console.log(`   🗑️  Deleted record ${_id}`);
      deletedCount++;
      continue;
    }

    // Update the image record
    const newFilePath = path.join(targetFolder, matchedFile);
    const relativePath = `/assets/${path.relative(path.join(__dirname, '../assets'), newFilePath).replace(/\\/g, '/')}`;

    image.fileName = matchedFile;
    image.filePath = relativePath;
    
    await image.save();
    console.log(`✓ Fixed image ${_id}:`);
    console.log(`   Old: ${fileName} -> ${filePath}`);
    console.log(`   New: ${matchedFile} -> ${relativePath}`);
    fixedCount++;
  }

  console.log('\n✅ Image path fixing complete!');
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Deleted: ${deletedCount}`);
  console.log(`   Not found: ${notFoundCount}`);
  
  await mongoose.connection.close();
  process.exit(0);
};

// Run the script
fixImagePaths().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

