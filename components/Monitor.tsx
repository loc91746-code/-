import React, { useEffect, useRef } from 'react';

interface MonitorProps {
  id: number;
  isOn: boolean;
  characterSeed?: string;
  onClick: (id: number) => void;
  onTimeout?: (id: number) => void;
  duration?: number; // How long the screen stays active in ms
  isGameLost: boolean;
}

export const Monitor: React.FC<MonitorProps> = ({ 
  id, 
  isOn, 
  characterSeed, 
  onClick, 
  onTimeout,
  duration = 2000, 
  isGameLost 
}) => {
  const timeoutRef = useRef<number | null>(null);

  // Handle auto-turn off (Miss)
  useEffect(() => {
    if (isOn && !isGameLost && onTimeout) {
      timeoutRef.current = window.setTimeout(() => {
        onTimeout(id);
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOn, isGameLost, onTimeout, id, duration]);

  // Determine screen color based on state
  const screenColor = isOn 
    ? 'bg-blue-50 shadow-[0_0_20px_rgba(34,211,238,0.6)]' 
    : 'bg-gray-900';

  // Construct the Avatar URL
  // Switched to 'bottts-neutral' (Robots) for a "System Glitch/Rogue AI" look.
  // Uses the unique seed passed from App.tsx for variety.
  const seed = characterSeed || 'system-default';
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}`;

  const content = isOn ? (
    <div className="w-full h-full relative overflow-hidden group-hover:scale-105 transition-transform duration-200 flex items-end justify-center">
      {/* Dynamic Character Avatar */}
      <img 
        src={avatarUrl}
        alt="Active Screen Character"
        className="w-[85%] h-[85%] object-contain object-center drop-shadow-lg mb-1"
        draggable={false}
      />
      {/* Timer Bar (Visual indicator of duration) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-200/30">
        <div 
          className="h-full bg-red-500 animate-pulse"
          style={{ 
            width: '100%',
            animation: `shrink ${duration}ms linear forwards`
          }}
        ></div>
      </div>

      {/* Glitch/Scanline overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  ) : (
    <div className="h-full w-full bg-black/50"></div>
  );

  // If game is lost, all screens flash violently
  const containerClass = isGameLost 
    ? 'animate-pulse bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)]' 
    : isOn ? 'cursor-pointer transform hover:scale-105 transition-transform duration-100' : '';

  return (
    <div className="flex flex-col items-center relative group">
      {/* Monitor Bezel */}
      <div 
        onClick={() => isOn && !isGameLost && onClick(id)}
        className={`
          relative w-full aspect-[4/3] rounded-lg border-[6px] border-gray-800 bg-gray-800 
          overflow-hidden select-none ${containerClass}
        `}
      >
        {/* Screen Area */}
        <div className={`w-full h-full ${isGameLost ? 'bg-red-600' : screenColor} transition-colors duration-200 relative`}>
          {!isGameLost && content}
        </div>
        
        {/* Power LED */}
        <div className={`absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full ${isOn || isGameLost ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,1)]' : 'bg-red-900'}`}></div>
      </div>
      
      {/* Monitor Stand */}
      <div className="w-1/3 h-4 bg-gray-700 mt-[-2px] z-0"></div>
      <div className="w-1/2 h-2 bg-gray-700 rounded-full"></div>
    </div>
  );
};