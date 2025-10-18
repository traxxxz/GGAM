import React, { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
  duration: number;
  onComplete: () => void;
  key: number; // Used to reset the timer from the parent
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ duration, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset timer when duration or key changes
    setTimeLeft(duration);

    // Clear any existing interval before starting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(intervalRef.current!);
          onComplete();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, onComplete]);

  const progress = (timeLeft / duration) * 100;
  
  const getBarColor = () => {
    if (progress > 50) return 'bg-green-500';
    if (progress > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="w-full flex flex-col items-center gap-2">
        <div className="font-mono text-3xl text-primary-400">{timeLeft}s</div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor()}`} 
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    </div>
  );
};