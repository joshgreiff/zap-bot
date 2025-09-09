'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import SpinningWheel from '@/components/SpinningWheel';

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

export default function WheelPage() {
  const params = useParams();
  const streamId = params.id as string;
  
  const [stream, setStream] = useState<Stream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);

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
    const interval = setInterval(loadStreamData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [loadStreamData]);

  const handleSpin = async () => {
    if (participants.length === 0 || isSpinning) return;
    
    setIsSpinning(true);
    setWinner(null);
    
    try {
      const response = await fetch(`/api/streams/${streamId}/spin`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Spin initiated:', data);
      }
    } catch (error) {
      console.error('Failed to initiate spin:', error);
    }
  };

  const handleWinner = (winner: Participant) => {
    console.log('Winner selected:', winner);
    setWinner(winner);
    setIsSpinning(false);
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Spinning Wheel</h1>
          <p className="text-xl text-purple-100">{stream?.name}</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <SpinningWheel
            participants={participants}
            onWinner={handleWinner}
            isSpinning={isSpinning}
          />
          
          {participants.length > 0 && (
            <div className="text-center mt-6">
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
              >
                {isSpinning ? ' Spinning...' : ' Spin the Wheel!'}
              </button>
            </div>
          )}

          {winner && (
            <div className="text-center mt-6 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-2xl font-bold mb-2">Winner!</h3>
              <p className="text-xl font-semibold">{winner.name}</p>
              <p className="text-sm opacity-90">{winner.speed_address}</p>
            </div>
          )}
        </div>

        {participants.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-2xl mt-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Participants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participants.map((participant) => (
                <div key={participant.id} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{participant.name}</h3>
                  <p className="text-sm text-gray-600">{participant.speed_address}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(participant.checked_in_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
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
