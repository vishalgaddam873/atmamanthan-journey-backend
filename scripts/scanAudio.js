require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Audio = require('../models/Audio');

// Cue point mappings based on file names
const getCuePoint = (category, fileName) => {
  const lowerName = fileName.toLowerCase();
  
  if (category === 'COMMON') {
    if (lowerName.includes('dark-room') || lowerName.includes('darkroom')) {
      return 'MIRROR_FADE';
    }
    if (lowerName.includes('choosing-emotion')) {
      return 'NONE'; // Will trigger mood selection
    }
  }
  
  if (category === 'NEGATIVE' || category === 'POSITIVE' || category === 'NEUTRAL') {
    if (lowerName.includes('seeing-mirror') || lowerName.includes('before-seeing')) {
      return 'MIRROR_FADE';
    }
    if (lowerName.includes('negative-images') || lowerName.includes('nuteral-images') || lowerName.includes('neutral-images')) {
      return 'SHOW_NEG_IMAGES';
    }
    if (lowerName.includes('positive-images')) {
      return 'SHOW_POS_IMAGES';
    }
    if (lowerName.includes('choosing-promise') || lowerName.includes('choosing-pran')) {
      return 'PRAN_SELECTION';
    }
    if (lowerName.includes('nirankar') || lowerName.includes('dhan')) {
      return 'ENDING';
    }
  }
  
  return 'NONE';
};

const scanAudioFiles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atmamanthan');
    console.log('Connected to MongoDB');

    const audioBasePath = path.join(__dirname, '../assets/Audio');
    
    // Categories and their folder names
    const categories = [
      { name: 'COMMON', folder: 'Common' },
      { name: 'NEGATIVE', folder: 'Negative Emotion Flow' },
      { name: 'POSITIVE', folder: 'Positive Emotion Flow' },
      { name: 'NEUTRAL', folder: 'Nuteral Emotion Flow' }
    ];

    for (const { name: category, folder } of categories) {
      const categoryPath = path.join(audioBasePath, folder);
      
      if (!fs.existsSync(categoryPath)) {
        console.log(`Folder not found: ${categoryPath}`);
        continue;
      }

      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.mp3'))
        .filter(file => !file.toLowerCase().includes('welcome_to_yatra') && !file.toLowerCase().includes('welcome-to-yatra'))
        .sort(); // Sort to maintain sequence

      console.log(`\nScanning ${category}: ${files.length} files`);

      for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const lowerName = fileName.toLowerCase();
        
        // Handle background audio files (bg1, bg2, etc.) - assign high sequence numbers
        let sequence;
        if (lowerName.startsWith('bg') && lowerName.endsWith('.mp3')) {
          // Extract number from bg files (bg1.mp3 -> 999, bg2.mp3 -> 998, etc.)
          const bgMatch = lowerName.match(/bg(\d+)\.mp3/);
          if (bgMatch) {
            const bgNum = parseInt(bgMatch[1], 10);
            sequence = 1000 - bgNum; // bg1 -> 999, bg2 -> 998, etc.
          } else {
            sequence = 999; // Default for bg files without number
          }
        } else {
          // Extract sequence number from filename (e.g., "1.Namskar.mp3" -> 1, "3.Step-1-Jagrutti.mp3" -> 3)
          // Filenames start with a number followed by a dot
          const sequenceMatch = fileName.match(/^(\d+)\./);
          sequence = sequenceMatch ? parseInt(sequenceMatch[1], 10) : i + 1;
        }
        
        const filePath = path.join(folder, fileName);
        // Path relative to assets folder (server serves /assets as static)
        // Store path with spaces - browser will handle URL encoding automatically
        const relativePath = `/assets/Audio/${folder}/${fileName}`;
        const cuePoint = getCuePoint(category, fileName);

        try {
          // For bg files, use fileName as unique identifier instead of sequence
          // For regular files, use category + sequence
          const query = lowerName.startsWith('bg') && lowerName.endsWith('.mp3')
            ? { category, fileName }
            : { category, sequence };
          
          // Upsert audio file
          await Audio.findOneAndUpdate(
            query,
            {
              category,
              sequence,
              filePath: relativePath,
              fileName,
              cuePoint
            },
            { upsert: true, new: true }
          );
          console.log(`  ✓ ${sequence}. ${fileName} (${cuePoint})`);
        } catch (error) {
          console.error(`  ✗ Error processing ${fileName}:`, error.message);
        }
      }
    }

    console.log('\n✓ Audio scanning completed!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

scanAudioFiles();

