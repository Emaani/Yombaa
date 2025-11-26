import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser?: AnalyserNode;
  isActive: boolean;
  color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isActive, color = '#8f7a55' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyser ? analyser.frequencyBinCount : 0;
    const dataArray = analyser ? new Uint8Array(bufferLength) : new Uint8Array(0);

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isActive || !analyser) {
         // Draw a flat line when idle
         ctx.beginPath();
         ctx.moveTo(0, canvas.height / 2);
         ctx.lineTo(canvas.width, canvas.height / 2);
         ctx.strokeStyle = '#e5e7eb'; // gray-200
         ctx.lineWidth = 2;
         ctx.stroke();
         return;
      }

      analyser.getByteFrequencyData(dataArray);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height; // Normalize height

        ctx.fillStyle = color;
        // Draw rounded bars centered vertically
        const y = (canvas.height - barHeight) / 2;
        
        // Simple smoothing for aesthetics
        if (barHeight > 2) {
            ctx.fillRect(x, y, barWidth, barHeight);
        }

        x += barWidth + 1;
      }
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [analyser, isActive, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-24 rounded-lg bg-safari-100/50 backdrop-blur-sm shadow-inner border border-safari-200"
    />
  );
};