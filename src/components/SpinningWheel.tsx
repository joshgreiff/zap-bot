'use client';

import { useState, useEffect, useRef } from 'react';

interface Participant {
  id: string;
  name: string;
  speed_address: string;
}

interface SpinningWheelProps {
  participants: Participant[];
  onWinner?: (winner: Participant) => void;
  isSpinning: boolean;
}

export default function SpinningWheel({ participants, onWinner, isSpinning }: SpinningWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];

  useEffect(() => {
    drawWheel();
  }, [participants, rotation]);

  useEffect(() => {
    if (isSpinning && !isAnimating) {
      spinWheel();
    }
  }, [isSpinning]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || participants.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wheel segments
    const anglePerSegment = (2 * Math.PI) / participants.length;
    
    participants.forEach((participant, index) => {
      const startAngle = index * anglePerSegment + rotation * (Math.PI / 180);
      const endAngle = (index + 1) * anglePerSegment + rotation * (Math.PI / 180);

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      const textAngle = startAngle + anglePerSegment / 2;
      const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
      const textY = centerY + Math.sin(textAngle) * (radius * 0.7);

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(participant.name, 0, 0);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX - 10, centerY - radius - 30);
    ctx.lineTo(centerX + 10, centerY - radius - 30);
    ctx.closePath();
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const spinWheel = () => {
    if (participants.length === 0) return;

    setIsAnimating(true);
    const spinDuration = 3000; // 3 seconds
    const minSpins = 5;
    const maxSpins = 8;
    const totalRotation = (minSpins + Math.random() * (maxSpins - minSpins)) * 360;
    
    let startTime: number;
    const startRotation = rotation;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (totalRotation * easeOut);
      
      setRotation(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        
        // Calculate winner
        const normalizedRotation = ((currentRotation % 360) + 360) % 360;
        const anglePerSegment = 360 / participants.length;
        const winnerIndex = Math.floor((360 - normalizedRotation) / anglePerSegment) % participants.length;
        const winner = participants[winnerIndex];
        
        if (onWinner) {
          onWinner(winner);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (participants.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-lg">No participants yet. Share the check-in link!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border-4 border-gray-300 rounded-full shadow-lg"
        />
      </div>
      
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700">
          {participants.length} participant{participants.length !== 1 ? 's' : ''} on the wheel
        </p>
        {isAnimating && (
          <p className="text-sm text-gray-500 mt-2">🎯 Spinning...</p>
        )}
      </div>
    </div>
  );
}
