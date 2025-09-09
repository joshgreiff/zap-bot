'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [name, setName] = useState('');
  const [speedAddress, setSpeedAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStreamInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}`);
      if (response.ok) {
        const data = await response.json();
        setStream(data);
        setError('');
      } else {
        setError('Stream not found');
      }
    } catch {
      setError('Failed to load stream info');
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    loadStreamInfo();
  }, [loadStreamInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/streams/${streamId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, speedAddress })
      });

      if (response.ok) {
        setSuccess(true);
        setName('');
        setSpeedAddress('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Check-in failed');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error && !stream) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚡ Check In</h1>
          <p className="text-xl text-purple-100">{stream?.name}</p>
        </div>

        {success ? (
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re In!</h2>
            <p className="text-gray-600 mb-4">
              You&apos;ve successfully checked in for the stream. Good luck!
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Check In Another Person
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label htmlFor="speedAddress" className="block text-sm font-medium text-gray-900 mb-2">
                  Speed Wallet Address
                </label>
                <input
                  type="text"
                  id="speedAddress"
                  value={speedAddress}
                  onChange={(e) => setSpeedAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="username@speed.app"
                  required
                />
                <p className="text-sm text-gray-700 mt-1">
                  Enter your full Speed wallet address (e.g., jerry@speed.app)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Checking In...' : 'Check In'}
              </button>
            </form>
          </div>
        )}

        <div className="text-center text-purple-100 mt-8">
          <p className="text-sm">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
