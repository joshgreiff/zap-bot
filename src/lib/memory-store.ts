// Simple in-memory store for development/demo
// In production, this would be replaced with Redis or a proper database

class MemoryStore {
  constructor() {
    this.streams = new Map();
    this.participants = new Map();
    this.zaps = new Map();
  }

  // Stream operations
  createStream(id, name) {
    const stream = {
      id,
      name,
      created_at: new Date().toISOString(),
      is_active: true,
      total_participants: 0
    };
    this.streams.set(id, stream);
    return stream;
  }

  // Auto-create stream if it doesn't exist (for serverless resilience)
  getOrCreateStream(id, name = 'Recovered Stream') {
    let stream = this.streams.get(id);
    if (!stream) {
      console.log(`Auto-creating missing stream: ${id}`);
      stream = this.createStream(id, name);
    }
    return stream;
  }

  getStream(id) {
    return this.streams.get(id);
  }

  getAllStreams() {
    return Array.from(this.streams.values());
  }

  // Participant operations
  addParticipant(streamId, name, speedAddress) {
    const participantId = `${streamId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const participant = {
      id: participantId,
      stream_id: streamId,
      name,
      speed_address: speedAddress,
      checked_in_at: new Date().toISOString()
    };
    
    this.participants.set(participantId, participant);
    
    // Update stream participant count
    const stream = this.getOrCreateStream(streamId);
    stream.total_participants = this.getParticipants(streamId).length;
    
    return participant;
  }

  getParticipants(streamId) {
    return Array.from(this.participants.values())
      .filter(p => p.stream_id === streamId);
  }

  getParticipant(participantId) {
    return this.participants.get(participantId);
  }

  // Zap operations
  addZap(streamId, participantId, amount, status = 'pending') {
    const zapId = `${streamId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const zap = {
      id: zapId,
      stream_id: streamId,
      participant_id: participantId,
      amount,
      status,
      sent_at: new Date().toISOString()
    };
    
    this.zaps.set(zapId, zap);
    return zap;
  }

  getZaps(streamId) {
    return Array.from(this.zaps.values())
      .filter(z => z.stream_id === streamId);
  }

  // Stats operations
  getStreamStats(streamId) {
    const participants = this.getParticipants(streamId);
    const zaps = this.getZaps(streamId);
    const totalZapped = zaps.reduce((sum, zap) => sum + (zap.amount || 0), 0);
    
    return {
      total_participants: participants.length,
      total_zaps: zaps.length,
      total_amount_zapped: totalZapped,
      successful_zaps: zaps.filter(z => z.status === 'success').length,
      failed_zaps: zaps.filter(z => z.status === 'failed').length
    };
  }

  // Debug operations
  getStatus() {
    return {
      streams: this.streams.size,
      participants: this.participants.size,
      zaps: this.zaps.size,
      uptime: process.uptime()
    };
  }

  // Serverless resilience - ensure critical streams exist
  ensureStreamExists(streamId, fallbackName = 'Live Stream') {
    if (!this.streams.has(streamId)) {
      console.log(`Creating missing stream ${streamId} for serverless resilience`);
      return this.createStream(streamId, fallbackName);
    }
    return this.streams.get(streamId);
  }
}

// Export singleton instance
const store = new MemoryStore();
export default store; 