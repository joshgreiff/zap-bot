'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Stream {
  id: string;
  name: string;
  created_at: string;
}

export default function CheckinPage() {
  const params = useParams();
  const streamId = params.id as string;
  
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [speedAddress, setSpeedAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    loadStreamInfo();
    loadApiStatus();
  }, [streamId]);

  const loadStreamInfo = async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}`);
      if (response.ok) {
        const data = await response.json();
        setStream(data);
      } else {
        setError('Stream not found');
      }
    } catch (err) {
      setError('Failed to load stream information');
    } finally {
      setLoading(false);
    }
  };

  const loadApiStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const status = await response.json();
        setIsSimulated(status.isSimulated);
      }
    } catch (err) {
      console.log('Could not load API status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!speedAddress.includes('@speed.app')) {
      alert('Please enter a valid Speed address (e.g., username@speed.app)');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/streams/${streamId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, speedAddress })
      });

      if (response.ok) {
        setSuccess(true);
        setUsername('');
        setSpeedAddress('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to check in');
      }
    } catch (err) {
      alert('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎡 Join the Wheel!</h1>
            <h2 className="text-xl text-gray-600">{stream?.name}</h2>
          </div>

          {isSimulated && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
              <strong>Demo Mode:</strong> This is a demonstration. No real zaps will be sent.
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">You're in!</h3>
              <p className="text-gray-600 mb-4">
                Successfully checked in to the stream. Good luck on the wheel!
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Check in another person
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="speedAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Speed Wallet Address
                </label>
                <input
                  type="text"
                  id="speedAddress"
                  value={speedAddress}
                  onChange={(e) => setSpeedAddress(e.target.value)}
                  placeholder="username@speed.app"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your full Speed address (e.g., worksavebitcoin@speed.app)
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {isSubmitting ? 'Checking in...' : 'Join the Wheel! 🎡'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
            Stream created: {stream ? new Date(stream.created_at).toLocaleString() : ''}
          </div>
        </div>
      </div>
    </div>
  );
} 