import React from 'react';
import { TrophyIcon, BoltIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface GameHUDProps {
  score: number;
  level: number;
  maxLevels: number;
  hitCount: number;
  spawnCount: number;
  totalSpawns: number;
  requiredHits: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({ 
  score, 
  level, 
  maxLevels, 
  hitCount, 
  spawnCount, 
  totalSpawns, 
  requiredHits 
}) => {
  
  // Calculate progress for the bar (how many screens have appeared)
  const progressPercentage = (spawnCount / totalSpawns) * 100;
  
  // Hit rate status
  const isPassing = hitCount >= (spawnCount - (totalSpawns - requiredHits)); 
  // Simplified visual logic: Just show green if doing well
  const scoreColor = hitCount >= requiredHits ? 'text-green-400' : 'text-white';

  return (
    <div className="w-full max-w-2xl flex flex-col md:flex-row justify-between items-center bg-gray-800/80 backdrop-blur-md p-4 rounded-xl border border-gray-700 shadow-xl mb-6 sticky top-4 z-20 gap-4 md:gap-0">
      
      {/* Level Info */}
      <div className="flex items-center space-x-3 md:border-r border-gray-700 md:pr-4 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <TrophyIcon className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Level</span>
            <span className="text-lg font-mono font-bold text-yellow-400">{level} / {maxLevels}</span>
          </div>
        </div>
         <div className="md:hidden flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Watts Saved</span>
            <span className="text-lg font-mono font-bold text-green-400">{score}W</span>
         </div>
      </div>

      {/* Progress Bar (Spawns) */}
      <div className="flex-1 px-4 w-full">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1">
             <BoltIcon className="w-3 h-3 text-cyan-400" /> Wave Progress
          </span>
          <span className="font-mono font-bold text-sm text-gray-300">
            {spawnCount}/{totalSpawns}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-500 transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Hit Counter / Target */}
      <div className="flex items-center space-x-3 md:pl-4 md:border-l border-gray-700 w-full md:w-auto justify-between md:justify-end">
        <div className="hidden md:flex flex-col items-end mr-4">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Watts Saved</span>
          <span className="text-xl font-mono font-bold text-green-400">{score}W</span>
        </div>
        
        <div className="flex items-center space-x-2">
           <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Targets</span>
            <span className={`text-xl font-mono font-bold ${scoreColor}`}>
              {hitCount} <span className="text-gray-500 text-sm">/ {requiredHits}</span>
            </span>
          </div>
          <div className={`p-2 rounded-lg ${hitCount >= requiredHits ? 'bg-green-500/20' : 'bg-gray-700'}`}>
            <CheckCircleIcon className={`w-5 h-5 ${hitCount >= requiredHits ? 'text-green-400' : 'text-gray-400'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};