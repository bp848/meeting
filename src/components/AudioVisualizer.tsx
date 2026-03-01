import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null as unknown as number);
  const analyserRef = useRef<AnalyserNode>(null as unknown as AnalyserNode);
  const audioContextRef = useRef<AudioContext>(null as unknown as AudioContext);
  const sourceRef = useRef<MediaStreamAudioSourceNode>(null as unknown as MediaStreamAudioSourceNode);

  useEffect(() => {
    if (!stream || !isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup Audio Context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioContextRef.current;

    analyserRef.current = audioCtx.createAnalyser();
    analyserRef.current.fftSize = 256;
    
    sourceRef.current = audioCtx.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.5; // Scale down

        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#60a5fa'); // Brand 400
        gradient.addColorStop(1, '#2563eb'); // Brand 600

        ctx.fillStyle = gradient;
        // Round caps
        ctx.beginPath();
        ctx.roundRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight, 2);
        ctx.fill();

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      // Note: We generally don't close AudioContext immediately in React to avoid re-init lag, 
      // but for cleanup correctness in this specific scope:
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        // audioContextRef.current.close(); 
      }
    };
  }, [stream, isRecording]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-24 rounded-lg opacity-80"
    />
  );
};