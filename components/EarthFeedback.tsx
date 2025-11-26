
import React from 'react';

interface EarthFeedbackProps {
  state: 'won' | 'lost' | 'idle';
}

export const EarthFeedback: React.FC<EarthFeedbackProps> = ({ state }) => {
  if (state === 'idle') return null;

  return (
    <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
      <div className={`relative w-48 h-48 ${state === 'lost' ? 'animate-shake' : 'animate-bounce-slow'}`}>
        {/* Earth Base */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          <circle cx="50" cy="50" r="45" fill="#1d4ed8" className="shadow-inner" /> {/* Ocean */}
          
          {/* Continents */}
          <path d="M30,30 Q40,20 50,35 T70,30 Q80,40 70,60 T40,70 Q20,60 30,30 Z" fill="#15803d" opacity="0.8" />
          <path d="M70,70 Q80,60 85,75 T70,85 Q60,80 70,70 Z" fill="#15803d" opacity="0.8" />
          
          {/* Face */}
          {state === 'won' ? (
            <g className="animate-pulse">
              {/* Happy Eyes */}
              <path d="M35,45 Q40,40 45,45" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <path d="M55,45 Q60,40 65,45" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
              {/* Kissing Mouth */}
              <circle cx="50" cy="60" r="3" fill="white" />
            </g>
          ) : (
            <g>
              {/* Sad Eyes (X) */}
              <path d="M35,40 L45,50 M45,40 L35,50" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <path d="M55,40 L65,50 M65,40 L55,50" stroke="white" strokeWidth="3" strokeLinecap="round" />
              {/* Sad Mouth */}
              <path d="M40,70 Q50,60 60,70" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}
        </svg>

        {/* Effects */}
        {state === 'won' && (
          <div className="absolute top-10 right-0 animate-float-up text-6xl">
            😘
          </div>
        )}
        
        {state === 'lost' && (
          <>
            <div className="absolute top-[50px] left-[38px] w-2 h-6 bg-blue-300 rounded-full animate-drip delay-100 opacity-80"></div>
            <div className="absolute top-[50px] right-[38px] w-2 h-6 bg-blue-300 rounded-full animate-drip opacity-80"></div>
          </>
        )}
      </div>
      
      <h2 className={`text-2xl font-bold mt-6 ${state === 'won' ? 'text-green-400' : 'text-blue-400'}`}>
        {state === 'won' ? "Planet Saved! Mwah!" : "System Meltdown..."}
      </h2>
    </div>
  );
};
