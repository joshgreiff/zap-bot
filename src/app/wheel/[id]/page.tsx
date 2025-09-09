'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SpinningWheel from '@/components/SpinningWheel';

interface Stream {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
  speed_address: string;
}

interface Winner {
  name: string;
  amount: number;
}

export default function WheelPage() {
  const params = useParams();
  const streamId = params.id as string;
  
  const [stream, setStream] = useState<Stream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  useEffect(() => {
    loadStreamData();
    const interval = setInterval(loadStreamData, 3000); // Refresh every 3 seconds
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

  const handleSpin = () => {
    if (participants.length === 0) {
      alert('No participants on the wheel yet!');
      return;
    }
    setIsSpinning(true);
    setWinner(null);
    setShowWinner(false);
  };

  const handleWinner = (winnerParticipant: Participant) => {
    setIsSpinning(false);
    setWinner({
      name: winnerParticipant.name,
      amount: 1000 // Default amount, could be configurable
    });
    setShowWinner(true);
  };

  const closeWinner = () => {
    setShowWinner(false);
    setWinner(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading wheel...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 flex items-center justify-center gap-4">
            <span className="text-5xl">🎡</span>
            Stream Wheel
          </h1>
          <h2 className="text-xl md:text-2xl text-purple-100">{stream?.name}</h2>
          <div className="mt-4 bg-white/20 backdrop-blur rounded-full px-6 py-2 inline-block">
            <span className="text-white font-semibold">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Wheel */}
        <div className="flex justify-center mb-8">
          <SpinningWheel
            participants={participants}
            onWinner={handleWinner}
            isSpinning={isSpinning}
          />
        </div>

        {/* Spin Button */}
        <div className="text-center">
          <button
            onClick={handleSpin}
            disabled={isSpinning || participants.length === 0}
            className="bg-gradient-to-r from-pink-500 to-red-500 text-white text-xl font-bold py-4 px-8 rounded-full shadow-2xl hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
          >
            {isSpinning ? '🎡 SPINNING...' : 'SPIN THE WHEEL'}
          </button>
          
          {participants.length === 0 && (
            <p className="text-white/70 mt-4">
              Waiting for participants to join...
            </p>
          )}
        </div>

        {/* Winner Modal */}
        {showWinner && winner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-8 text-center max-w-md w-full shadow-2xl">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">WINNER!</h2>
              <h3 className="text-2xl font-semibold text-white mb-4">{winner.name}</h3>
              <div className="text-xl text-green-100 mb-6">
                Wins {winner.amount} sats! ⚡
              </div>
              <button
                onClick={closeWinner}
                className="bg-white/20 backdrop-blur text-white font-semibold py-3 px-6 rounded-full hover:bg-white/30 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Participants List */}
        {participants.length > 0 && (
          <div className="mt-12 bg-white/10 backdrop-blur rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Participants on the Wheel
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="bg-white/20 backdrop-blur text-white text-center py-2 px-3 rounded-lg text-sm font-medium"
                >
                  {participant.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 