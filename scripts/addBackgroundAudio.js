require('dotenv').config();
const mongoose = require('mongoose');
const Audio = require('../models/Audio');

const addBackgroundAudio = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atmamanthan');
    console.log('Connected to MongoDB');

    // Background audio files to add
    const backgroundAudios = [
      {
        category: 'COMMON',
        fileName: 'bg1.mp3',
        filePath: '/assets/Audio/Common/bg1.mp3',
        sequence: 999, // High sequence number so it doesn't interfere with regular audio
        cuePoint: 'NONE'
      },
      {
        category: 'COMMON',
        fileName: 'bg2.mp3',
        filePath: '/assets/Audio/Common/bg2.mp3',
        sequence: 998, // High sequence number so it doesn't interfere with regular audio
        cuePoint: 'NONE'
      }
    ];

    console.log('\nAdding background audio files to database...\n');

    for (const audioData of backgroundAudios) {
      try {
        // Use fileName as unique identifier instead of sequence for bg files
        const existing = await Audio.findOne({ 
          category: audioData.category, 
          fileName: audioData.fileName 
        });

        if (existing) {
          // Update existing
          await Audio.findByIdAndUpdate(existing._id, audioData, { new: true });
          console.log(`  ✓ Updated: ${audioData.fileName}`);
        } else {
          // Create new
          const audio = new Audio(audioData);
          await audio.save();
          console.log(`  ✓ Added: ${audioData.fileName}`);
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${audioData.fileName}:`, error.message);
      }
    }

    console.log('\n✓ Background audio files added/updated!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addBackgroundAudio();

