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

// Scan and register images from assets folder
const scanImages = async () => {
  await connectDB();

  // Define image mappings for all age groups and emotion types
  const imageMappings = [
    // Kids (4-9)
    {
      folder: path.join(__dirname, '../assets/Kids/Positive'),
      category: 'POSITIVE',
      ageGroup: '4-9',
      type: 'POS-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/Kids/Negative'),
      category: 'NEGATIVE',
      ageGroup: '4-9',
      type: 'NEG-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/Kids/Positive'),
      category: 'NEGATIVE',
      ageGroup: '4-9',
      type: 'POS-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/Kids/Neutral'),
      category: 'NEUTRAL',
      ageGroup: '4-9',
      type: 'NEG-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/Kids/Positive'),
      category: 'NEUTRAL',
      ageGroup: '4-9',
      type: 'POS-EMOTION',
    },
    // PreTeens (9-14)
    {
      folder: path.join(__dirname, '../assets/PreTeens/Positive'),
      category: 'POSITIVE',
      ageGroup: '9-14',
      type: 'POS-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/PreTeens/Negative'),
      category: 'NEGATIVE',
      ageGroup: '9-14',
      type: 'NEG-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/PreTeens/Positive'),
      category: 'NEGATIVE',
      ageGroup: '9-14',
      type: 'POS-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/PreTeens/Neutral'),
      category: 'NEUTRAL',
      ageGroup: '9-14',
      type: 'NEG-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/PreTeens/Positive'),
      category: 'NEUTRAL',
      ageGroup: '9-14',
      type: 'POS-EMOTION',
    },
    // TeenPlus (15+)
    {
      folder: path.join(__dirname, '../assets/TeenPlus/Positive'),
      category: 'POSITIVE',
      ageGroup: '15+',
      type: 'POS-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/TeenPlus/Negative'),
      category: 'NEGATIVE',
      ageGroup: '15+',
      type: 'NEG-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/TeenPlus/Positive'),
      category: 'NEGATIVE',
      ageGroup: '15+',
      type: 'POS-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/TeenPlus/Neutral'),
      category: 'NEUTRAL',
      ageGroup: '15+',
      type: 'NEG-EMOTION',
    },
    {
      folder: path.join(__dirname, '../assets/TeenPlus/Positive'),
      category: 'NEUTRAL',
      ageGroup: '15+',
      type: 'POS-EMOTION',
    },
  ];

  for (const mapping of imageMappings) {
    const { folder, category, ageGroup, type } = mapping;

    if (!fs.existsSync(folder)) {
      console.log(`⚠️  Folder does not exist: ${folder}`);
      continue;
    }

    console.log(`\n📁 Scanning folder: ${folder}`);
    console.log(`   Category: ${category}, Age Group: ${ageGroup}, Type: ${type}`);

    const files = fs.readdirSync(folder)
      .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
      .sort(); // Sort alphabetically

    console.log(`   Found ${files.length} image files`);

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = path.join(folder, fileName);
      
      // Extract display order from filename (e.g., "positive-kids-1.png" -> 1)
      // Or use index if no number found
      const numberMatch = fileName.match(/(\d+)/);
      const displayOrder = numberMatch ? parseInt(numberMatch[1]) - 1 : i; // -1 because we want 0-based indexing
      
      // Construct relative path from assets folder
      // e.g., /assets/Kids/Positive/image 1.png
      const relativePath = `/assets/${path.relative(path.join(__dirname, '../assets'), filePath).replace(/\\/g, '/')}`;

      try {
        // Check if image already exists
        const existingImage = await Image.findOne({
          category,
          ageGroup,
          type,
          fileName,
        });

        if (existingImage) {
          console.log(`   ⏭️  Skipping ${fileName} (already exists)`);
          // Update displayOrder if different
          if (existingImage.displayOrder !== displayOrder) {
            existingImage.displayOrder = displayOrder;
            await existingImage.save();
            console.log(`   ✓ Updated displayOrder to ${displayOrder}`);
          }
          continue;
        }

        // Create new image record
        const image = new Image({
          category,
          ageGroup,
          type,
          filePath: relativePath,
          fileName,
          displayOrder,
        });

        await image.save();
        console.log(`   ✓ Registered: ${fileName} (displayOrder: ${displayOrder})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`   ⏭️  Skipping ${fileName} (duplicate)`);
        } else {
          console.error(`   ✗ Error registering ${fileName}:`, error.message);
        }
      }
    }
  }

  console.log('\n✅ Image scanning complete!');
  await mongoose.connection.close();
  process.exit(0);
};

// Run the script
scanImages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

