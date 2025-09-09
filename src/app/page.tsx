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
        const streams = await response.json();
        if (streams.length > 0) {
          setActiveStreams(streams);
        } else {
          setShowCreateForm(true);
        }
      } else {
        setShowCreateForm(true);
      }
    } catch {
      console.log('No active streams found');
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
        const data = await response.json();
        setCreatedStream(data);
        setShowCreateForm(false);
      } else {
        throw new Error('Failed to create stream');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
        alert('Failed to end stream');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
          <p className="text-xl text-purple-100">Stream wheel zap automation for Jerry Loves Freedom</p>
        </div>

        {showCreateForm && !createdStream && (
          <div className="bg-white rounded-xl p-8 shadow-2xl mb-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Create New Stream</h2>
            <form onSubmit={createStream} className="space-y-4">
              <div>
                <label htmlFor="streamName" className="block text-sm font-medium text-gray-900 mb-2">
                  Stream Name
                </label>
                <input
                  type="text"
                  id="streamName"
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  placeholder="e.g., PHAT Zap Friday"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Stream'}
              </button>
            </form>
          </div>
        )}

        {createdStream && (
          <div className="bg-white rounded-xl p-8 shadow-2xl mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 Stream Created!</h2>
              <p className="text-lg text-gray-600">Your stream &quot;{createdStream.name}&quot; is ready to go!</p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="font-semibold mb-2 text-gray-900">Check-in link for viewers:</p>
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{stream.name}</h3>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(stream.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Participants: {stream.total_participants}
                      </p>
                    </div>
                    <button
                      onClick={() => endStream(stream.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      End Stream
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-purple-100">
          <p className="text-sm">
            Built for Jerry Loves Freedom • Lightning zaps powered by Speed API
          </p>
        </div>
      </div>
    </div>
  );
}
