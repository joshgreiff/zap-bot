'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

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
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWinner, setSelectedWinner] = useState('');
  const [zapAmount, setZapAmount] = useState(1000);
  const [isZapping, setIsZapping] = useState(false);

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
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Network error occurred');
    }
  };

  useEffect(() => {
    loadStreamData();
    loadApiStatus();
    const interval = setInterval(loadStreamData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [streamId]);

  const loadStreamData = async () => {
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
    } catch (err) {
      setError('Failed to load stream data');
    } finally {
      setLoading(false);
    }
  };

  const loadApiStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const status = await response.json();
        setApiStatus(status);
      }
    } catch (err) {
      console.log('Could not load API status');
    }
  };

  const handleZap = async () => {
    if (!selectedWinner) {
      alert('Please select a winner first');
      return;
    }

    setIsZapping(true);

    try {
      const response = await fetch(`/api/streams/${streamId}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner: selectedWinner, amount: zapAmount })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setSelectedWinner('');
        loadStreamData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      alert('Network error occurred');
    } finally {
      setIsZapping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin panel...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-600 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚡ Admin Panel</h1>
          <h2 className="text-xl text-green-100">{stream?.name}</h2>
        </div>

        {/* API Status */}
        {apiStatus && (
          <div className={`rounded-xl p-4 mb-6 ${
            apiStatus.isSimulated ? 'bg-yellow-100 border border-yellow-400' : 'bg-green-100 border border-green-400'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`font-bold ${apiStatus.isSimulated ? 'text-yellow-800' : 'text-green-800'}`}>
                  {apiStatus.isSimulated ? '🧪 SIMULATION MODE' : '⚡ LIVE MODE'}
                </span>
                <div className={`text-sm ${apiStatus.isSimulated ? 'text-yellow-700' : 'text-green-700'}`}>
                  {apiStatus.isSimulated ? 'No real zaps will be sent' : `Balance: ${apiStatus.balance} sats`}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Participants */}
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              Participants ({participants.length})
            </h3>
            
            {participants.length === 0 ? (
              <div className="text-center py-8 text-gray-800">
                <div className="text-4xl mb-2">👥</div>
                <p className="font-medium">No participants yet</p>
                <p className="text-sm">Share the check-in link to get started!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedWinner === participant.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedWinner(participant.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1" onClick={() => setSelectedWinner(participant.id)}>
                        <div className="font-semibold text-gray-900">{participant.name}</div>
                        <div className="text-sm text-gray-800">{participant.speed_address}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-700">
                          {new Date(participant.checked_in_at).toLocaleTimeString()}
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zap Controls */}
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Send Zap</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Selected Winner
                </label>
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                  {selectedWinner ? (
                    participants.find(p => p.id === selectedWinner)?.name || 'Unknown'
                  ) : (
                    'Click on a participant to select'
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Zap Amount (sats)
                </label>
                <input
                  type="number"
                  value={zapAmount}
                  onChange={(e) => setZapAmount(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <button
                onClick={handleZap}
                disabled={!selectedWinner || isZapping}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isZapping ? 'Sending Zap...' : `⚡ Send ${zapAmount} sats`}
              </button>
            </div>

            {/* Quick Links */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-semibold mb-3 text-gray-900">Quick Links</h4>
              <div className="grid grid-cols-1 gap-2">
                <a
                  href={`/wheel/${streamId}`}
                  target="_blank"
                  className="bg-purple-500 text-white text-center py-2 px-4 rounded hover:bg-purple-600"
                >
                  🎡 Open Spinning Wheel (for stream)
                </a>
                <a
                  href={`/checkin/${streamId}`}
                  target="_blank"
                  className="bg-green-500 text-white text-center py-2 px-4 rounded hover:bg-green-600"
                >
                  📝 Check-in Page
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Info */}
        <div className="mt-8 bg-white/10 backdrop-blur rounded-xl p-6">
          <div className="text-white text-center">
            <div className="text-sm opacity-75">
              Stream created: {stream ? new Date(stream.created_at).toLocaleString() : ''}
            </div>
            <div className="text-xs opacity-50 mt-2">
              Stream ID: {streamId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 