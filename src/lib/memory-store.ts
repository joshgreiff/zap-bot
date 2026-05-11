import { v4 as uuidv4 } from 'uuid';
import postgres from 'postgres';

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
  lightning_address: string;
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

type StreamRow = {
  id: string;
  name: string;
  created_at: string | Date;
  is_active: boolean;
  total_participants: number;
};

type CreatedStream = Stream & {
  admin_token: string;
};

type ParticipantRow = {
  id: string;
  stream_id: string;
  name: string;
  lightning_address: string;
  checked_in_at: string | Date;
};

type ZapRow = {
  id: string;
  stream_id: string;
  participant_id: string;
  amount: number;
  status: string;
  created_at: string | Date;
};

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = databaseUrl
  ? postgres(databaseUrl, {
      max: 1,
      ssl: databaseUrl.includes('localhost') ? false : 'require',
    })
  : null;

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapStream(row: StreamRow): Stream {
  return {
    id: row.id,
    name: row.name,
    created_at: toIsoString(row.created_at),
    is_active: row.is_active,
    total_participants: row.total_participants,
  };
}

function mapParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    stream_id: row.stream_id,
    name: row.name,
    lightning_address: row.lightning_address,
    checked_in_at: toIsoString(row.checked_in_at),
  };
}

function mapZap(row: ZapRow): Zap {
  return {
    id: row.id,
    stream_id: row.stream_id,
    participant_id: row.participant_id,
    amount: row.amount,
    status: row.status,
    created_at: toIsoString(row.created_at),
  };
}

class MemoryStore {
  private streams: Map<string, Stream> = new Map();
  private adminTokens: Map<string, string> = new Map();
  private participants: Map<string, Participant> = new Map();
  private zaps: Map<string, Zap> = new Map();
  private schemaReady = false;

  private async ensureSchema(): Promise<void> {
    if (!sql || this.schemaReady) return;

    await sql`
      CREATE TABLE IF NOT EXISTS streams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        admin_token TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        total_participants INTEGER NOT NULL DEFAULT 0
      )
    `;

    await sql`
      ALTER TABLE streams
      ADD COLUMN IF NOT EXISTS admin_token TEXT
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        stream_id TEXT NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        lightning_address TEXT NOT NULL,
        checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        removed_at TIMESTAMPTZ
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS zaps (
        id TEXT PRIMARY KEY,
        stream_id TEXT NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
        participant_id TEXT NOT NULL REFERENCES participants(id),
        amount INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    this.schemaReady = true;
  }

  // Stream operations
  async createStream(id: string, name: string, adminToken: string = uuidv4()): Promise<CreatedStream> {
    await this.ensureSchema();

    if (sql) {
      const [stream] = await sql<(StreamRow & { admin_token: string })[]>`
        INSERT INTO streams (id, name, admin_token)
        VALUES (${id}, ${name}, ${adminToken})
        RETURNING id, name, admin_token, created_at, is_active, total_participants
      `;
      console.log(`Created stream: ${id} with name: ${name}`);
      return {
        ...mapStream(stream),
        admin_token: stream.admin_token,
      };
    }

    const stream: Stream = {
      id,
      name,
      created_at: new Date().toISOString(),
      is_active: true,
      total_participants: 0
    };
    this.streams.set(id, stream);
    this.adminTokens.set(id, adminToken);
    console.log(`Created stream: ${id} with name: ${name}`);
    return {
      ...stream,
      admin_token: adminToken,
    };
  }

  async ensureStreamExists(id: string, name: string = 'Unknown Stream'): Promise<Stream> {
    await this.ensureSchema();

    if (sql) {
      const [stream] = await sql<StreamRow[]>`
        INSERT INTO streams (id, name)
        VALUES (${id}, ${name})
        ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
        RETURNING id, name, created_at, is_active, total_participants
      `;
      return mapStream(stream);
    }

    let stream = this.streams.get(id);
    if (!stream) {
      console.log(`Auto-creating missing stream: ${id}`);
      stream = await this.createStream(id, name);
    }
    return stream;
  }

  async getStream(id: string): Promise<Stream | undefined> {
    await this.ensureSchema();

    if (sql) {
      const [stream] = await sql<StreamRow[]>`
        SELECT id, name, created_at, is_active, total_participants
        FROM streams
        WHERE id = ${id}
      `;
      return stream ? mapStream(stream) : undefined;
    }

    return this.streams.get(id);
  }

  async validateAdminToken(streamId: string, token: string | null | undefined): Promise<boolean> {
    if (!token) return false;

    await this.ensureSchema();

    if (sql) {
      const [stream] = await sql<{ id: string }[]>`
        SELECT id
        FROM streams
        WHERE id = ${streamId}
          AND admin_token = ${token}
      `;
      return !!stream;
    }

    return this.adminTokens.get(streamId) === token;
  }

  async getAllStreams(): Promise<Stream[]> {
    await this.ensureSchema();

    if (sql) {
      const streams = await sql<StreamRow[]>`
        SELECT id, name, created_at, is_active, total_participants
        FROM streams
        ORDER BY created_at DESC
      `;
      return streams.map(mapStream);
    }

    return Array.from(this.streams.values());
  }

  async endStream(id: string): Promise<void> {
    await this.ensureSchema();

    if (sql) {
      await sql`
        UPDATE streams
        SET is_active = FALSE
        WHERE id = ${id}
      `;
      return;
    }

    const stream = this.streams.get(id);
    if (stream) {
      stream.is_active = false;
    }
  }

  // Participant operations
  async addParticipant(streamId: string, name: string, lightningAddress: string): Promise<Participant> {
    await this.ensureSchema();

    const participantId = `${streamId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (sql) {
      const [participant] = await sql<ParticipantRow[]>`
        INSERT INTO participants (id, stream_id, name, lightning_address)
        VALUES (${participantId}, ${streamId}, ${name}, ${lightningAddress})
        RETURNING id, stream_id, name, lightning_address, checked_in_at
      `;

      await sql`
        UPDATE streams
        SET total_participants = (
          SELECT COUNT(*)::int
          FROM participants
          WHERE stream_id = ${streamId}
            AND removed_at IS NULL
        )
        WHERE id = ${streamId}
      `;

      console.log(`Added participant: ${name} (${lightningAddress}) to stream: ${streamId}`);
      return mapParticipant(participant);
    }

    const participant: Participant = {
      id: participantId,
      stream_id: streamId,
      name,
      lightning_address: lightningAddress,
      checked_in_at: new Date().toISOString()
    };
    
    this.participants.set(participantId, participant);
    
    // Update stream participant count
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.total_participants = (await this.getParticipants(streamId)).length;
    }
    
    console.log(`Added participant: ${name} (${lightningAddress}) to stream: ${streamId}`);
    return participant;
  }

  async getParticipants(streamId: string): Promise<Participant[]> {
    await this.ensureSchema();

    if (sql) {
      const participants = await sql<ParticipantRow[]>`
        SELECT id, stream_id, name, lightning_address, checked_in_at
        FROM participants
        WHERE stream_id = ${streamId}
          AND removed_at IS NULL
        ORDER BY checked_in_at ASC
      `;
      return participants.map(mapParticipant);
    }

    return Array.from(this.participants.values()).filter(p => p.stream_id === streamId);
  }

  async getParticipant(participantId: string): Promise<Participant | undefined> {
    await this.ensureSchema();

    if (sql) {
      const [participant] = await sql<ParticipantRow[]>`
        SELECT id, stream_id, name, lightning_address, checked_in_at
        FROM participants
        WHERE id = ${participantId}
          AND removed_at IS NULL
      `;
      return participant ? mapParticipant(participant) : undefined;
    }

    return this.participants.get(participantId);
  }

  async removeParticipant(participantId: string): Promise<void> {
    await this.ensureSchema();

    if (sql) {
      const [participant] = await sql<{ stream_id: string }[]>`
        UPDATE participants
        SET removed_at = NOW()
        WHERE id = ${participantId}
          AND removed_at IS NULL
        RETURNING stream_id
      `;

      if (participant) {
        await sql`
          UPDATE streams
          SET total_participants = (
            SELECT COUNT(*)::int
            FROM participants
            WHERE stream_id = ${participant.stream_id}
              AND removed_at IS NULL
          )
          WHERE id = ${participant.stream_id}
        `;
      }

      console.log(`Removed participant: ${participantId}`);
      return;
    }

    const participant = this.participants.get(participantId);
    if (participant) {
      this.participants.delete(participantId);
      
      // Update stream participant count
      const stream = this.streams.get(participant.stream_id);
      if (stream) {
        stream.total_participants = (await this.getParticipants(participant.stream_id)).length;
      }
      
      console.log(`Removed participant: ${participantId}`);
    }
  }

  // Zap operations
  async addZap(streamId: string, participantId: string, amount: number, status: string): Promise<Zap> {
    await this.ensureSchema();

    const zapId = uuidv4();

    if (sql) {
      const [zap] = await sql<ZapRow[]>`
        INSERT INTO zaps (id, stream_id, participant_id, amount, status)
        VALUES (${zapId}, ${streamId}, ${participantId}, ${amount}, ${status})
        RETURNING id, stream_id, participant_id, amount, status, created_at
      `;
      console.log(`Added zap: ${amount} sats to participant: ${participantId} (${status})`);
      return mapZap(zap);
    }

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

  async getZaps(streamId: string): Promise<Zap[]> {
    await this.ensureSchema();

    if (sql) {
      const zaps = await sql<ZapRow[]>`
        SELECT id, stream_id, participant_id, amount, status, created_at
        FROM zaps
        WHERE stream_id = ${streamId}
        ORDER BY created_at DESC
      `;
      return zaps.map(mapZap);
    }

    return Array.from(this.zaps.values()).filter(z => z.stream_id === streamId);
  }

  // Stats
  async getStreamStats(streamId: string): Promise<{ totalZapsSent: number; totalSatsSent: number }> {
    await this.ensureSchema();

    if (sql) {
      const [stats] = await sql<{ total_zaps_sent: number; total_sats_sent: number }[]>`
        SELECT COUNT(*)::int AS total_zaps_sent, COALESCE(SUM(amount), 0)::int AS total_sats_sent
        FROM zaps
        WHERE stream_id = ${streamId}
      `;

      return {
        totalZapsSent: stats.total_zaps_sent,
        totalSatsSent: stats.total_sats_sent,
      };
    }

    const zaps = await this.getZaps(streamId);
    return {
      totalZapsSent: zaps.length,
      totalSatsSent: zaps.reduce((sum, zap) => sum + zap.amount, 0)
    };
  }

  // Status
  async getStatus(): Promise<{ mode: 'postgres' | 'memory'; streams: number; participants: number; zaps: number }> {
    await this.ensureSchema();

    if (sql) {
      const [status] = await sql<{ streams: number; participants: number; zaps: number }[]>`
        SELECT
          (SELECT COUNT(*)::int FROM streams) AS streams,
          (SELECT COUNT(*)::int FROM participants WHERE removed_at IS NULL) AS participants,
          (SELECT COUNT(*)::int FROM zaps) AS zaps
      `;

      return {
        mode: 'postgres',
        streams: status.streams,
        participants: status.participants,
        zaps: status.zaps,
      };
    }

    return {
      mode: 'memory',
      streams: this.streams.size,
      participants: this.participants.size,
      zaps: this.zaps.size
    };
  }
}

const store = new MemoryStore();
export default store;
