'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface Stream {
  id: string;
  name: string;
  created_at: string;
}

function checkinDoneKey(streamId: string) {
  return `zapbot-checkin-done:${streamId}`;
}

export default function CheckinPage() {
  const params = useParams();
  const streamId = params.id as string;
  
  const [stream, setStream] = useState<Stream | null>(null);
  const [name, setName] = useState('');
  const [lightningAddress, setLightningAddress] = useState('');
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

  useEffect(() => {
    if (!streamId || typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(checkinDoneKey(streamId))) {
        setSuccess(true);
      }
    } catch {
      // ignore private mode / blocked storage
    }
  }, [streamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/streams/${streamId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, lightningAddress })
      });

      if (response.ok) {
        try {
          sessionStorage.setItem(checkinDoneKey(streamId), '1');
        } catch {
          // ignore
        }
        setSuccess(true);
        setName('');
        setLightningAddress('');
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
            <p className="text-gray-600">
              You&apos;re checked in for this stream. Good luck — you can close this page.
            </p>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label htmlFor="lightningAddress" className="block text-sm font-medium text-gray-900 mb-2">
                  Lightning address
                </label>
                <input
                  type="text"
                  id="lightningAddress"
                  value={lightningAddress}
                  onChange={(e) => setLightningAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="you@coinos.io"
                  required
                />
                <p className="text-sm text-gray-700 mt-1">
                  Any Lightning address works (e.g. you@coinos.io, you@speed.app, or a LNURL-pay identifier).
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

        {!success && (
          <div className="text-center text-purple-100 mt-8">
            <p className="text-sm">Last updated: {new Date().toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
