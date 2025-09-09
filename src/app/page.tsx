'use client';

import { useState, useEffect } from 'react';

interface Stream {
  id: string;
  name: string;
  created_at: string;
  total_participants: number;
}

interface CreatedStream {
  streamId: string;
  name: string;
  checkInUrl: string;
  adminUrl: string;
  wheelUrl: string;
}

export default function Home() {
  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [streamName, setStreamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdStream, setCreatedStream] = useState<CreatedStream | null>(null);

  useEffect(() => {
    loadActiveStreams();
  }, []);

  const loadActiveStreams = async () => {
    try {
      const response = await fetch('/api/streams');
      if (response.ok) {
        const streams: Stream[] = await response.json();
        if (streams.length > 0) {
          setActiveStreams(streams);
        } else {
          setShowCreateForm(true);
        }
      } else {
        setShowCreateForm(true);
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.log('Error loading active streams:', errorMessage);
      setShowCreateForm(true);
    }
  };

  const createStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: streamName })
      });

      if (response.ok) {
        const data: CreatedStream = await response.json();
        setCreatedStream(data);
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create stream');
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert('Error creating stream: ' + errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const endStream = async (streamId: string) => {
    if (!confirm('Are you sure you want to end this stream?')) return;

    try {
      const response = await fetch(`/api/streams/${streamId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadActiveStreams();
        setCreatedStream(null);
      } else {
        const errorData = await response.json();
        alert('Failed to end stream: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert('Error ending stream: ' + errorMessage);
    }
  };

  const copyToClipboard = (text: string, button: HTMLButtonElement) => {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">⚡ Zap Bot</h1>
          <p className="text-xl text-white opacity-90">Stream wheel zap automation for Jerry Loves Freedom</p>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-6 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Create a New Stream</h2>
            <form onSubmit={createStream} className="space-y-4">
              <div>
                <label htmlFor="streamName" className="block text-sm font-medium text-gray-900">Stream Name</label>
                <input
                  type="text"
                  id="streamName"
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="e.g., PHAT Zap Friday"
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isCreating}
              >
                {isCreating ? 'Creating Stream...' : 'Create Stream'}
              </button>
            </form>
          </div>
        )}

        {createdStream && (
          <div className="bg-white rounded-xl p-6 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Stream Created!</h2>
            <p className="text-lg font-semibold text-gray-900 mb-4">Stream Name: {createdStream.name}</p>

            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2 text-gray-900">Your check-in link (share with viewers!):</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-800 text-green-400 p-2 rounded text-sm font-mono">{createdStream.checkInUrl}</code>
                  <button
                    onClick={(e) => copyToClipboard(createdStream.checkInUrl, e.target as HTMLButtonElement)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Copy Check-in Link
                  </button>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2 text-gray-900">Your admin panel:</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-800 text-blue-400 p-2 rounded text-sm font-mono">{createdStream.adminUrl}</code>
                  <button
                    onClick={(e) => copyToClipboard(createdStream.adminUrl, e.target as HTMLButtonElement)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Copy Admin Link
                  </button>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2 text-gray-900">Your spinning wheel (share this on stream!):</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-800 text-purple-400 p-2 rounded text-sm font-mono">{createdStream.wheelUrl}</code>
                  <button
                    onClick={(e) => copyToClipboard(createdStream.wheelUrl, e.target as HTMLButtonElement)}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Copy Wheel Link
                  </button>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-900 mt-4 font-medium">
              Save these links! You&apos;ll need them for your stream.
            </p>
          </div>
        )}

        {activeStreams.length > 0 && !createdStream && (
          <div className="bg-white rounded-xl p-6 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Active Streams</h2>
            <div className="space-y-4">
              {activeStreams.map((stream) => (
                <div key={stream.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{stream.name}</h3>
                  <p className="text-gray-800 mb-1">Participants: {stream.total_participants}</p>
                  <p className="text-gray-700 text-sm mb-4">Created: {new Date(stream.created_at).toLocaleString()}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <a
                      href={`/checkin/${stream.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600"
                    >
                      Check-in Link
                    </a>
                    <a
                      href={`/admin/${stream.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
                    >
                      Admin Panel
                    </a>
                    <a
                      href={`/wheel/${stream.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-500 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-600"
                    >
                      Spinning Wheel
                    </a>
                  </div>
                  <button
                    onClick={() => endStream(stream.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                  >
                    End Stream
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showCreateForm && !createdStream && activeStreams.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-2xl text-center text-gray-900">
            <p className="text-lg">Loading active streams...</p>
          </div>
        )}

        <footer className="text-center text-white opacity-80 mt-8">
          <p>&copy; {new Date().getFullYear()} Zap Bot. Built with ❤️ for Jerry Loves Freedom.</p>
          <p className="text-sm mt-2">Support development: <a href="https://geyser.fund/joshgreiff" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">geyser.fund/joshgreiff</a></p>
        </footer>
      </div>
    </div>
  );
}
