const Session = require('../models/Session');
const SessionHistory = require('../models/SessionHistory');
const Audio = require('../models/Audio');

// Mood to category mapping
const moodToCategory = {
  'ANXIETY': 'NEGATIVE',
  'SAD': 'NEGATIVE',
  'ANGRY': 'NEGATIVE',
  'HAPPY': 'POSITIVE',
  'LOVE': 'POSITIVE',
  'CONFUSED': 'NEUTRAL'
};

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join LIVE room
    socket.join('LIVE');

    // Send current session state on connect
    socket.on('get_session', async () => {
      try {
        const session = await Session.getLiveSession();
        socket.emit('session_state', session);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Age selection
    socket.on('age_selected', async (data) => {
      try {
        const { ageGroup } = data;
        if (!ageGroup || !['KIDS', 'PRE-TEEN', 'TEEN+'].includes(ageGroup)) {
          return socket.emit('error', { message: 'Invalid age group' });
        }
        
        const session = await Session.getLiveSession();
        session.ageGroup = ageGroup;
        session.currentPhase = 'COMMON_FLOW';
        await session.save();
        
        io.to('LIVE').emit('age_selected', { ageGroup });
        io.to('LIVE').emit('phase_changed', { phase: 'COMMON_FLOW' });
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        console.error('Age selection error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Mood selection
    socket.on('mood_selected', async (data) => {
      try {
        const { mood } = data;
        if (!mood || !moodToCategory[mood]) {
          return socket.emit('error', { message: 'Invalid mood' });
        }
        
        const category = moodToCategory[mood];
        
        const session = await Session.getLiveSession();
        session.mood = mood;
        session.category = category;
        session.currentPhase = 'CATEGORY_FLOW';
        await session.save();
        
        io.to('LIVE').emit('mood_selected', { mood, category });
        io.to('LIVE').emit('phase_changed', { phase: 'CATEGORY_FLOW' });
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        console.error('Mood selection error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Pran selection - Save to history when session completes
    socket.on('pran_selected', async (data) => {
      try {
        const { pranId } = data;
        const session = await Session.getLiveSession();
        session.pran = pranId;
        session.currentPhase = 'ENDING';
        await session.save();
        
        // Save completed session to history for analytics
        if (session.ageGroup && session.mood && session.category && pranId) {
          try {
            const sessionStartTime = session.createdAt || new Date();
            const duration = Math.floor((new Date() - sessionStartTime) / 1000); // Duration in seconds
            
            await SessionHistory.create({
              ageGroup: session.ageGroup,
              mood: session.mood,
              category: session.category,
              pran: pranId,
              duration: duration,
              completedAt: new Date()
            });
            
            console.log('Session saved to history:', {
              ageGroup: session.ageGroup,
              mood: session.mood,
              category: session.category,
              pran: pranId
            });
          } catch (historyError) {
            console.error('Error saving session history:', historyError);
            // Don't fail the request if history save fails
          }
        }
        
        io.to('LIVE').emit('pran_selected', { pranId });
        io.to('LIVE').emit('phase_changed', { phase: 'ENDING' });
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Audio control
    socket.on('audio_play', async (data) => {
      try {
        const { audioPath, cue, audioId } = data;
        const session = await Session.getLiveSession();
        session.currentAudio = audioPath;
        session.currentCue = cue || session.currentCue;
        session.audioState = 'PLAYING';
        await session.save();
        
        // Check for cue points if audioId is provided
        if (audioId) {
          try {
            const audio = await Audio.findById(audioId);
            if (audio && audio.cuePoint && audio.cuePoint !== 'NONE') {
              console.log(`Triggering cue point: ${audio.cuePoint} for audio: ${audio.fileName}`);
              // Trigger cue point immediately
              io.to('LIVE').emit('cue_trigger', {
                cuePoint: audio.cuePoint,
                data: {
                  category: session.category,
                  ageGroup: session.ageGroup,
                  audioId: audio._id,
                  audioName: audio.fileName
                }
              });
            }
          } catch (error) {
            console.error('Error checking cue point:', error);
          }
        }
        
        io.to('LIVE').emit('audio_play', { audioPath, cue, audioId });
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('audio_pause', async () => {
      try {
        const session = await Session.getLiveSession();
        session.audioState = 'PAUSED';
        await session.save();
        
        io.to('LIVE').emit('audio_pause');
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('audio_stop', async () => {
      try {
        const session = await Session.getLiveSession();
        session.audioState = 'STOPPED';
        await session.save();
        
        io.to('LIVE').emit('audio_stop');
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('audio_skip', async (data) => {
      try {
        const { nextCue } = data;
        const session = await Session.getLiveSession();
        session.currentCue = nextCue;
        await session.save();
        
        io.to('LIVE').emit('audio_skip', { nextCue });
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('audio_restart', async () => {
      try {
        const session = await Session.getLiveSession();
        session.currentCue = 0;
        session.audioState = 'STOPPED';
        await session.save();
        
        io.to('LIVE').emit('audio_restart');
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Cue point triggers
    socket.on('cue_trigger', async (data) => {
      try {
        const { cuePoint, data: cueData } = data;
        io.to('LIVE').emit('cue_trigger', { cuePoint, data: cueData });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Force phase jump (admin)
    socket.on('force_phase', async (data) => {
      try {
        const { phase } = data;
        const session = await Session.getLiveSession();
        session.currentPhase = phase;
        await session.save();
        
        io.to('LIVE').emit('phase_changed', { phase });
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Reset session
    socket.on('reset_session', async () => {
      try {
        const session = await Session.getLiveSession();
        session.ageGroup = null;
        session.mood = null;
        session.category = null;
        session.pran = null;
        session.currentPhase = 'INIT';
        session.currentAudio = null;
        session.currentCue = 0;
        session.audioState = 'STOPPED';
        await session.save();
        
        io.to('LIVE').emit('session_reset');
        io.to('LIVE').emit('phase_changed', { phase: 'INIT' });
        io.to('LIVE').emit('session_state', session);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = setupSocketHandlers;

