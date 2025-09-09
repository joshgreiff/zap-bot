'use client';

import { useState, useEffect } from 'react';

interface Stream {
  id: string;
  name: string;
  created_at: string;
  total_participants: number;
}

export default function Home() {
  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [streamName, setStreamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdStream, setCreatedStream] = useState<any>(null);

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
    } catch (error) {
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
    } catch (error: any) {
      alert('Error creating stream: ' + error.message);
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
    } catch (error: any) {
      alert('Error ending stream: ' + error.message);
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
          <p className="text-xl text-purple-100">Automate your stream wheel zaps with ease</p>
        </div>

        {createdStream && (
          <div className="bg-white rounded-xl p-6 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold text-green-600 mb-4">🎉 Stream Created Successfully!</h2>
            
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Share this link with your viewers to check in:</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-100 p-2 rounded text-sm">{createdStream.checkInUrl}</code>
                  <button 
                    onClick={(e) => copyToClipboard(createdStream.checkInUrl, e.target as HTMLButtonElement)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Copy Check-in Link
                  </button>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Your admin panel:</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-100 p-2 rounded text-sm">{createdStream.adminUrl}</code>
                  <button 
                    onClick={(e) => copyToClipboard(createdStream.adminUrl, e.target as HTMLButtonElement)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Copy Admin Link
                  </button>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Your spinning wheel (share this on stream!):</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-100 p-2 rounded text-sm">{createdStream.wheelUrl}</code>
                  <button 
                    onClick={(e) => copyToClipboard(createdStream.wheelUrl, e.target as HTMLButtonElement)}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Copy Wheel Link
                  </button>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              Save these links! You'll need them for your stream.
            </p>
          </div>
        )}

        {activeStreams.length > 0 && !createdStream && (
          <div className="bg-white rounded-xl p-6 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold mb-4">Active Streams</h2>
            <div className="space-y-4">
              {activeStreams.map((stream) => (
                <div key={stream.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold">{stream.name}</h3>
                  <div className="text-sm text-gray-600 mb-3">
                    Created: {new Date(stream.created_at).toLocaleString()}<br />
                    Participants: {stream.total_participants || 0}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <a 
                      href={`/checkin/${stream.id}`} 
                      target="_blank"
                      className="bg-blue-500 text-white text-center py-2 px-4 rounded hover:bg-blue-600"
                    >
                      Check-in
                    </a>
                    <a 
                      href={`/admin/${stream.id}`} 
                      target="_blank"
                      className="bg-green-500 text-white text-center py-2 px-4 rounded hover:bg-green-600"
                    >
                      Admin
                    </a>
                    <a 
                      href={`/wheel/${stream.id}`} 
                      target="_blank"
                      className="bg-purple-500 text-white text-center py-2 px-4 rounded hover:bg-purple-600"
                    >
                      Wheel
                    </a>
                  </div>
                  <button 
                    onClick={() => endStream(stream.id)}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                  >
                    End Stream
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="mt-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Create New Stream
            </button>
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <form onSubmit={createStream} className="space-y-4">
              <div>
                <label htmlFor="streamName" className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Name
                </label>
                <input
                  type="text"
                  id="streamName"
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  placeholder="e.g., Jerry's Friday Night Stream"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
              >
                {isCreating ? 'Creating...' : 'Create Stream Session'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
