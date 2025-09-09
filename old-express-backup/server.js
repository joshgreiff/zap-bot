const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const SpeedAPI = require('./speed-api');
const store = require('./memory-store');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Speed API
const speedAPI = new SpeedAPI();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Using in-memory store instead of SQLite for better serverless compatibility
console.log('Zap Bot initialized with memory store');

// Routes

// Get all active streams
app.get('/api/streams', (req, res) => {
  try {
    const streams = store.getAllStreams().filter(s => s.is_active);
    console.log(`Returning ${streams.length} active streams`);
    res.json(streams);
  } catch (error) {
    console.error('Error getting streams:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new stream session
app.post('/api/streams', (req, res) => {
  const { name } = req.body;
  const streamId = uuidv4();
  
  console.log(`Creating stream: ${streamId} with name: ${name}`);
  
  try {
    const stream = store.createStream(streamId, name);
    console.log('Stream created successfully:', stream);
    
    const baseUrl = process.env.NODE_ENV === 'production' ? 
      'https://zap-bot.vercel.app' : 
      `${req.protocol}://${req.get('host')}`;
    
    res.json({
      streamId,
      name,
      checkInUrl: `${baseUrl}/checkin/${streamId}`,
      adminUrl: `${baseUrl}/admin/${streamId}`,
      wheelUrl: `${baseUrl}/wheel/${streamId}`
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get stream info
app.get('/api/streams/:id', (req, res) => {
  const { id } = req.params;
  
  console.log(`Looking for stream: ${id}`);
  
  try {
    // Always ensure stream exists for serverless resilience
    const stream = store.ensureStreamExists(id);
    console.log('Stream ensured:', stream);
    
    const participants = store.getParticipants(id);
    console.log(`Found ${participants.length} participants`);
    
    res.json({
      ...stream,
      participants
    });
  } catch (error) {
    console.error('Error getting stream:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check in to a stream
app.post('/api/streams/:id/checkin', (req, res) => {
  const { id } = req.params;
  const { username, speedAddress } = req.body;
  
  if (!username || !speedAddress) {
    return res.status(400).json({ error: 'Username and Speed address are required' });
  }
  
  try {
    // Ensure stream exists for serverless resilience
    const stream = store.ensureStreamExists(id);
    
    // Add participant
    const participant = store.addParticipant(id, username, speedAddress);
    
    console.log('New participant added:', participant);
    
    // Notify admin via socket
    io.to(`admin-${id}`).emit('new-participant', {
      username,
      speedAddress,
      checkedInAt: participant.checked_in_at
    });
    
    res.json({ message: 'Successfully checked in!' });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get participants for wheel
app.get('/api/streams/:id/participants', (req, res) => {
  const { id } = req.params;
  
  try {
    const participants = store.getParticipants(id);
    res.json(participants.map(p => ({
      username: p.username,
      speed_address: p.speed_address,
      checked_in_at: p.checked_in_at
    })));
  } catch (error) {
    console.error('Error getting participants:', error);
    res.status(500).json({ error: error.message });
  }
});

// End a stream
app.delete('/api/streams/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const stream = store.getStream(id);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    // Mark stream as inactive
    stream.is_active = false;
    console.log(`Stream ${id} ended`);
    
    // Notify all connected clients that stream ended
    io.to(`stream-${id}`).emit('stream-ended');
    io.to(`admin-${id}`).emit('stream-ended');
    
    res.json({ message: 'Stream ended successfully' });
  } catch (error) {
    console.error('Error ending stream:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get API status
app.get('/api/status', async (req, res) => {
  const status = speedAPI.getStatus();
  const balance = await speedAPI.getBalance();
  const storeStatus = store.getStatus();
  
  res.json({
    ...status,
    balance: balance.balance,
    balanceError: balance.error,
    store: storeStatus
  });
});

// Select winner and send zap
app.post('/api/streams/:id/spin', async (req, res) => {
  const { id } = req.params;
  const { winner, amount = 1000 } = req.body; // default 1000 sats
  
  if (!winner) {
    return res.status(400).json({ error: 'Winner username is required' });
  }
  
  try {
    // Ensure stream exists for serverless resilience
    const stream = store.ensureStreamExists(id);
    
    // Get winner's participant info (winner is now participant ID)
    const participant = store.getParticipant(winner);
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    // Send the zap via Speed API
    const zapResult = await speedAPI.sendZap(
      participant.speed_address,
      amount,
      `Stream wheel win - ${participant.name}`
    );
    
    const status = zapResult.success ? (zapResult.simulated ? 'simulated' : 'completed') : 'failed';
    
    // Record the zap in store
    const zap = store.addZap(id, winner, amount, status);
    
    // Notify all connected clients
    io.to(`stream-${id}`).emit('winner-selected', {
      winner: participant.name,
      amount,
      speedAddress: participant.speed_address,
      zapResult: zapResult
    });
    
    res.json({
      message: zapResult.success ? 
        (zapResult.simulated ? 'Winner selected and zap simulated!' : 'Winner selected and zap sent!') :
        'Winner selected but zap failed',
      winner: participant.name,
      amount,
      speedAddress: participant.speed_address,
      zapResult: zapResult
    });
    
  } catch (error) {
    console.error('Spin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join stream room (for participants)
  socket.on('join-stream', (streamId) => {
    socket.join(`stream-${streamId}`);
    console.log(`Socket ${socket.id} joined stream-${streamId}`);
  });
  
  // Join admin room (for stream creator)
  socket.on('join-admin', (streamId) => {
    socket.join(`admin-${streamId}`);
    console.log(`Socket ${socket.id} joined admin-${streamId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve static files
app.get('/checkin/:streamId', (req, res) => {
  res.sendFile(__dirname + '/public/checkin.html');
});

app.get('/admin/:streamId', (req, res) => {
  const { streamId } = req.params;
  // Ensure stream exists when admin page is accessed
  store.ensureStreamExists(streamId);
  res.sendFile(__dirname + '/public/admin.html');
});

app.get('/wheel/:streamId', (req, res) => {
  const { streamId } = req.params;
  // Ensure stream exists when wheel page is accessed
  store.ensureStreamExists(streamId);
  res.sendFile(__dirname + '/public/wheel.html');
});

app.get('/checkin/:streamId', (req, res) => {
  const { streamId } = req.params;
  // Ensure stream exists when checkin page is accessed
  store.ensureStreamExists(streamId);
  res.sendFile(__dirname + '/public/checkin.html');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Zap Bot server running on port ${PORT}`);
  console.log(`Create a stream at: http://localhost:${PORT}`);
}); 