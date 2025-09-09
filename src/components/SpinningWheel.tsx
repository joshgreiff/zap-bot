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
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (participants.length === 0) {
      // Draw empty wheel
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw "No participants" text
      ctx.fillStyle = '#666';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No participants yet', centerX, centerY);
      return;
    }

    const anglePerSegment = (2 * Math.PI) / participants.length;

    // Draw segments
    participants.forEach((participant, index) => {
      const startAngle = (index * anglePerSegment) + (rotation * Math.PI / 180);
      const endAngle = ((index + 1) * anglePerSegment) + (rotation * Math.PI / 180);

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
      const textRadius = radius * 0.7;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

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
    ctx.fillStyle = '#333';
    ctx.fill();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 5);
    ctx.lineTo(centerX - 15, centerY - radius - 25);
    ctx.lineTo(centerX + 15, centerY - radius - 25);
    ctx.closePath();
    ctx.fillStyle = '#333';
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
    let startRotation = rotation;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Easing function for realistic deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (totalRotation * easeOut);
      
      setRotation(currentRotation % 360);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        // Determine winner
        const normalizedRotation = (360 - (currentRotation % 360)) % 360;
        const anglePerSegment = 360 / participants.length;
        const winnerIndex = Math.floor(normalizedRotation / anglePerSegment);
        const winner = participants[winnerIndex];
        
        if (onWinner && winner) {
          setTimeout(() => onWinner(winner), 500);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="border-4 border-white rounded-full shadow-2xl"
      />
      <div className="mt-4 text-center">
        <div className="text-lg font-semibold text-white">
          {participants.length} participant{participants.length !== 1 ? 's' : ''} on the wheel
        </div>
        {isAnimating && (
          <div className="text-yellow-300 font-bold mt-2 animate-pulse">
            🎡 Spinning...
          </div>
        )}
      </div>
    </div>
  );
} 