import { v4 as uuidv4 } from 'uuid';

interface Stream {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  total_participants: number;
}

interface Participant {
  id: string;
  stream_id: string;
  name: string;
  speed_address: string;
  checked_in_at: string;
}

interface Zap {
  id: string;
  stream_id: string;
  participant_id: string;
  amount: number;
  status: string;
  created_at: string;
}

class MemoryStore {
  private streams: Map<string, Stream> = new Map();
  private participants: Map<string, Participant> = new Map();
  private zaps: Map<string, Zap> = new Map();

  // Stream operations
  createStream(id: string, name: string): Stream {
    const stream: Stream = {
      id,
      name,
      created_at: new Date().toISOString(),
      is_active: true,
      total_participants: 0
    };
    this.streams.set(id, stream);
    console.log(`Created stream: ${id} with name: ${name}`);
    return stream;
  }

  ensureStreamExists(id: string, name: string = 'Unknown Stream'): Stream {
    let stream = this.streams.get(id);
    if (!stream) {
      console.log(`Auto-creating missing stream: ${id}`);
      stream = this.createStream(id, name);
    }
    return stream;
  }

  getStream(id: string): Stream | undefined {
    return this.streams.get(id);
  }

  getAllStreams(): Stream[] {
    return Array.from(this.streams.values());
  }

  // Participant operations
  addParticipant(streamId: string, name: string, speedAddress: string): Participant {
    const participantId = `${streamId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const participant: Participant = {
      id: participantId,
      stream_id: streamId,
      name,
      speed_address: speedAddress,
      checked_in_at: new Date().toISOString()
    };
    
    this.participants.set(participantId, participant);
    
    // Update stream participant count
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.total_participants = this.getParticipants(streamId).length;
    }
    
    console.log(`Added participant: ${name} (${speedAddress}) to stream: ${streamId}`);
    return participant;
  }

  getParticipants(streamId: string): Participant[] {
    return Array.from(this.participants.values()).filter(p => p.stream_id === streamId);
  }

  getParticipant(participantId: string): Participant | undefined {
    return this.participants.get(participantId);
  }

  removeParticipant(participantId: string): void {
    const participant = this.participants.get(participantId);
    if (participant) {
      this.participants.delete(participantId);
      
      // Update stream participant count
      const stream = this.streams.get(participant.stream_id);
      if (stream) {
        stream.total_participants = this.getParticipants(participant.stream_id).length;
      }
      
      console.log(`Removed participant: ${participantId}`);
    }
  }

  // Zap operations
  addZap(streamId: string, participantId: string, amount: number, status: string): Zap {
    const zapId = uuidv4();
    const zap: Zap = {
      id: zapId,
      stream_id: streamId,
      participant_id: participantId,
      amount,
      status,
      created_at: new Date().toISOString()
    };
    
    this.zaps.set(zapId, zap);
    console.log(`Added zap: ${amount} sats to participant: ${participantId} (${status})`);
    return zap;
  }

  getZaps(streamId: string): Zap[] {
    return Array.from(this.zaps.values()).filter(z => z.stream_id === streamId);
  }

  // Stats
  getStreamStats(streamId: string): { totalZapsSent: number; totalSatsSent: number } {
    const zaps = this.getZaps(streamId);
    return {
      totalZapsSent: zaps.length,
      totalSatsSent: zaps.reduce((sum, zap) => sum + zap.amount, 0)
    };
  }

  // Status
  getStatus(): { streams: number; participants: number; zaps: number } {
    return {
      streams: this.streams.size,
      participants: this.participants.size,
      zaps: this.zaps.size
    };
  }
}

const store = new MemoryStore();
export default store;
