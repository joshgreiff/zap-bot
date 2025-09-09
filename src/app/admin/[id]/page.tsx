'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Stream {
  id: string;
  name: string;
  created_at: string;
}

interface Participant {
  id: string;
  name: string;
  speed_address: string;
  checked_in_at: string;
}

interface ApiStatus {
  isSimulated: boolean;
  hasApiKey: boolean;
  balance: number;
}

export default function AdminPage() {
  const params = useParams();
  const streamId = params.id as string;
  
  const [stream, setStream] = useState<Stream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [zapAmount, setZapAmount] = useState(1000);
  const [isSpinning, setIsSpinning] = useState(false);

  const loadApiStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        setApiStatus(data);
      }
    } catch {
      // Ignore API status errors
    }
  };

  const loadStreamData = useCallback(async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}`);
      if (response.ok) {
        const data = await response.json();
        setStream(data);
        setParticipants(data.participants || []);
        setError('');
      } else {
        setError('Stream not found');
      }
    } catch {
      setError('Failed to load stream data');
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    loadStreamData();
    loadApiStatus();
    const interval = setInterval(loadStreamData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [loadStreamData]);

  const removeParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadStreamData(); // Refresh the participant list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch {
      alert('Network error occurred');
    }
  };

  const selectWinner = async () => {
    if (!selectedWinner) {
      alert('Please select a winner first');
      return;
    }

    setIsSpinning(true);

    try {
      const response = await fetch(`/api/streams/${streamId}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner: selectedWinner, amount: zapAmount })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setSelectedWinner('');
        await loadStreamData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch {
      alert('Network error occurred');
    } finally {
      setIsSpinning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚡ Admin Panel</h1>
          <p className="text-xl text-purple-100">{stream?.name}</p>
        </div>

        {apiStatus && (
          <div className="bg-white rounded-xl p-6 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">API Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Mode</p>
                <p className="text-lg font-semibold text-gray-900">
                  {apiStatus.isSimulated ? '🎭 SIMULATION' : '⚡ LIVE'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">API Key</p>
                <p className="text-lg font-semibold text-gray-900">
                  {apiStatus.hasApiKey ? '✅ Configured' : '❌ Missing'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-lg font-semibold text-gray-900">
                  {apiStatus.balance.toLocaleString()} sats
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Participants */}
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Participants ({participants.length})</h2>
            {participants.length === 0 ? (
              <p className="text-gray-600">No participants yet. Share the check-in link!</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedWinner === participant.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedWinner(participant.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{participant.name}</h3>
                        <p className="text-sm text-gray-600">{participant.speed_address}</p>
                        <p className="text-xs text-gray-500">
                          Checked in: {new Date(participant.checked_in_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeParticipant(participant.id);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                        title="Remove participant"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Winner Selection */}
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Select Winner</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="zapAmount" className="block text-sm font-medium text-gray-900 mb-2">
                  Zap Amount (sats)
                </label>
                <input
                  type="number"
                  id="zapAmount"
                  value={zapAmount}
                  onChange={(e) => setZapAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  min="1"
                />
              </div>

              <button
                onClick={selectWinner}
                disabled={!selectedWinner || isSpinning}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpinning ? 'Spinning...' : 'Send Zap to Winner'}
              </button>

              {selectedWinner && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Selected:</strong> {participants.find(p => p.id === selectedWinner)?.name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Amount:</strong> {zapAmount} sats
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl p-6 shadow-2xl mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href={`/checkin/${streamId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white p-4 rounded-lg text-center hover:bg-green-600 transition-colors"
            >
              📝 Check-in Page
            </a>
            <a
              href={`/wheel/${streamId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-500 text-white p-4 rounded-lg text-center hover:bg-purple-600 transition-colors"
            >
              🎯 Spinning Wheel
            </a>
            <Link
              href="/"
              className="bg-blue-500 text-white p-4 rounded-lg text-center hover:bg-blue-600 transition-colors block"
            >
              🏠 Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
