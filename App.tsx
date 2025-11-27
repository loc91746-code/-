
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor } from './components/Monitor';
import { GameHUD } from './components/GameHUD';
import { EarthFeedback } from './components/EarthFeedback';
import { generateEcoFeedback } from './services/geminiService';
import { playSound, startMusic, stopMusic } from './services/audioService';
import { GameState, MonitorState } from './types';
import { PlayIcon, ArrowPathIcon, ForwardIcon } from '@heroicons/react/24/solid';

const GRID_SIZE = 12; // 12 screens
const MAX_LEVELS = 3;
const TOTAL_SPAWNS = 10; // Reduced to 10 screens per level
const REQUIRED_HITS = 8; // Need >= 8 to pass (8-10 is success)
const WATTS_PER_CLICK = 75;

// Difficulty Settings - UPDATED FOR EVEN FASTER SPEED
// duration: How long the screen stays on (ms)
// spawnRate: Interval between spawns (ms)
const LEVEL_CONFIG = [
  { duration: 1300, spawnRate: 900 }, // Level 1: Faster Start
  { duration: 1000, spawnRate: 700 }, // Level 2: Very Fast
  { duration: 700, spawnRate: 500 }   // Level 3: Extreme
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [screens, setScreens] = useState<MonitorState[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Counters for the new game mechanic
  const [spawnCount, setSpawnCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);

  // Refs
  const spawnerRef = useRef<number | null>(null);

  // Initialize screens
  useEffect(() => {
    const initialScreens = Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      isOn: false,
    }));
    setScreens(initialScreens);
  }, []);

  // --- Game Logic ---

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setLevel(1);
    setFeedback('');
    resetLevelCounters();
    playSound('spawn');
    startMusic(1); // Start music with Level 1 intensity
  };

  const startNextLevel = () => {
    setGameState(GameState.PLAYING);
    const nextLevel = level + 1;
    setLevel(nextLevel);
    resetLevelCounters();
    playSound('spawn');
    startMusic(nextLevel); // Increase intensity
  };

  const resetLevelCounters = () => {
    setSpawnCount(0);
    setHitCount(0);
    setMissedCount(0);
    setScreens(prev => prev.map(s => ({ ...s, isOn: false, characterSeed: undefined })));
  };

  const handleMonitorClick = (id: number) => {
    if (gameState !== GameState.PLAYING) return;

    playSound('click');
    setScreens(prev => 
      prev.map(s => s.id === id ? { ...s, isOn: false } : s)
    );
    setScore(prev => prev + WATTS_PER_CLICK);
    setHitCount(prev => prev + 1);
  };

  const handleMonitorTimeout = (id: number) => {
    if (gameState !== GameState.PLAYING) return;
    
    // Screen turns off automatically
    playSound('miss');
    setScreens(prev => 
      prev.map(s => s.id === id ? { ...s, isOn: false } : s)
    );
    setMissedCount(prev => prev + 1);
  };

  const endGame = useCallback(async (won: boolean) => {
    if (spawnerRef.current) clearInterval(spawnerRef.current);
    stopMusic(); // Stop the tense music

    setGameState(won ? GameState.WON : GameState.LOST);
    if (won) playSound('gameWon');
    else playSound('gameOver');
    
    setLoadingFeedback(true);
    const feedbackText = await generateEcoFeedback(score, won);
    setFeedback(feedbackText);
    setLoadingFeedback(false);
  }, [score]);

  const completeLevel = useCallback(() => {
    if (spawnerRef.current) clearInterval(spawnerRef.current);
    stopMusic(); // Stop music between levels
    playSound('levelComplete');
    setGameState(GameState.LEVEL_COMPLETE);
  }, []);

  // Check Level Completion Condition
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      // Level ends when all generated spawns are accounted for (Hit or Missed)
      // AND we have finished spawning everything.
      if (hitCount + missedCount === TOTAL_SPAWNS && spawnCount === TOTAL_SPAWNS) {
        if (hitCount >= REQUIRED_HITS) {
          if (level < MAX_LEVELS) {
            completeLevel();
          } else {
            endGame(true); // Final Win
          }
        } else {
          endGame(false); // Failed Level
        }
      }
    }
  }, [hitCount, missedCount, spawnCount, level, gameState, endGame, completeLevel]);


  // Spawner Loop
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      const config = LEVEL_CONFIG[level - 1] || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
      
      spawnerRef.current = window.setInterval(() => {
        setSpawnCount(prev => {
          if (prev >= TOTAL_SPAWNS) {
            if (spawnerRef.current) clearInterval(spawnerRef.current);
            return prev;
          }

          setScreens(prevScreens => {
            const offScreens = prevScreens.filter(s => !s.isOn);
            if (offScreens.length === 0) return prevScreens;

            const randomIndex = Math.floor(Math.random() * offScreens.length);
            const targetId = offScreens[randomIndex].id;
            
            // Randomize ID to get different workers each spawn
            // Changed prefix to 'Worker' to match the new visual theme
            const characterId = `Worker-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Play a spawn sound occasionally or just visual? 
            // Playing sound on every spawn might be chaotic if too fast, but let's try it for feedback.
            playSound('spawn');

            return prevScreens.map(s => s.id === targetId ? { ...s, isOn: true, characterSeed: characterId } : s);
          });

          return prev + 1;
        });
      }, config.spawnRate);
    }

    return () => {
      if (spawnerRef.current) clearInterval(spawnerRef.current);
    };
  }, [gameState, level]);


  // --- Render Helpers ---

  const renderOverlay = () => {
    if (gameState === GameState.PLAYING) return null;

    const isMenu = gameState === GameState.MENU;
    const isLevelComplete = gameState === GameState.LEVEL_COMPLETE;
    const isWon = gameState === GameState.WON;
    const isLost = gameState === GameState.LOST;

    let title = "OFFICE SAVER";
    let subtitle = `Turn off monitors! Hit ${REQUIRED_HITS}/${TOTAL_SPAWNS} to pass.`;
    let buttonText = "Start Game";
    let buttonColor = "bg-cyan-600 hover:bg-cyan-500";
    let EarthState: 'won' | 'lost' | 'idle' = 'idle';

    if (isWon) {
      title = "MISSION ACCOMPLISHED";
      subtitle = `Perfect! You saved ${score} Watts total!`;
      buttonText = "Play Again";
      buttonColor = "bg-green-600 hover:bg-green-500";
      EarthState = 'won';
    } else if (isLost) {
      title = "SYSTEM OVERLOAD";
      subtitle = `You only hit ${hitCount}/${TOTAL_SPAWNS}. Need ${REQUIRED_HITS} to pass.`;
      buttonText = "Try Again";
      buttonColor = "bg-red-600 hover:bg-red-500";
      EarthState = 'lost';
    } else if (isLevelComplete) {
      title = `LEVEL ${level} COMPLETE`;
      subtitle = `Score: ${hitCount}/${TOTAL_SPAWNS}. System stabilized.`;
      buttonText = `Start Level ${level + 1}`;
      buttonColor = "bg-yellow-600 hover:bg-yellow-500";
      EarthState = 'won';
    }

    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center flex flex-col items-center">
          
          {/* Animation Section */}
          <div className="mb-6 min-h-[160px] flex items-center justify-center">
            {isWon || isLost || isLevelComplete ? (
              <EarthFeedback state={EarthState} />
            ) : (
               <div className="w-32 h-32 bg-cyan-900/50 rounded-full flex items-center justify-center border-4 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                 <PlayIcon className="w-16 h-16 text-cyan-400 ml-2" />
               </div>
            )}
          </div>

          <h1 className={`text-3xl md:text-4xl font-black mb-2 ${isLost ? 'text-red-500' : (isWon || isLevelComplete) ? 'text-green-400' : 'text-cyan-400'}`}>
            {title}
          </h1>
          {!isWon && !isLost && <p className="text-gray-300 mb-6 text-lg">{subtitle}</p>}

          {(isWon || isLost) && (
             <div className="mb-6 p-4 w-full bg-gray-800/50 rounded-lg border border-gray-700 min-h-[60px] flex items-center justify-center">
               {loadingFeedback ? (
                 <span className="text-gray-500 animate-pulse text-sm">Transmitting to HQ...</span>
               ) : (
                 <p className="text-sm text-gray-200 italic">"{feedback}"</p>
               )}
             </div>
          )}

          {isMenu && (
             <div className="text-xs text-gray-500 mb-8 space-y-1">
               <p>Target: {TOTAL_SPAWNS} screens per level.</p>
               <p className="text-green-400 font-bold">Pass: {REQUIRED_HITS}+ Hits</p>
               <p className="text-red-400 font-bold">Fail: {REQUIRED_HITS - 1} or fewer</p>
               <p>Speed increases every level!</p>
             </div>
          )}

          <button
            onClick={isLevelComplete ? startNextLevel : startGame}
            className={`
              w-full py-4 rounded-xl text-white font-bold text-xl uppercase tracking-widest shadow-lg
              transform transition-all duration-200 hover:scale-[1.02] active:scale-95
              flex items-center justify-center gap-2
              ${buttonColor}
            `}
          >
            {isMenu ? <PlayIcon className="w-6 h-6" /> : isLevelComplete ? <ForwardIcon className="w-6 h-6" /> : <ArrowPathIcon className="w-6 h-6" />}
            {buttonText}
          </button>
        </div>
      </div>
    );
  };

  const currentLevelConfig = LEVEL_CONFIG[level - 1] || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center relative overflow-hidden font-sans text-gray-100">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black z-0"></div>
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30"></div>
      
      {/* CSS Animations for Earth */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes drip {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        @keyframes float-up {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-40px) scale(1.5); opacity: 0; }
        }
        .animate-shake { animation: shake 0.5s ease-in-out infinite; }
        .animate-drip { animation: drip 1.5s infinite; }
        .animate-float-up { animation: float-up 1.5s ease-out infinite; }
        .animate-bounce-slow { animation: bounce 2s infinite; }
      `}</style>

      <div className="w-full max-w-4xl px-4 py-8 z-10 flex flex-col h-screen">
        
        {/* Header / HUD */}
        <header className="flex flex-col items-center mb-4">
          <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4 opacity-80">
            OFFICE POWER SAVER
          </h1>
          <GameHUD 
            score={score} 
            level={level} 
            maxLevels={MAX_LEVELS}
            hitCount={hitCount}
            spawnCount={spawnCount}
            totalSpawns={TOTAL_SPAWNS}
            requiredHits={REQUIRED_HITS}
          />
        </header>

        {/* Game Grid */}
        <main className="flex-1 flex items-center justify-center relative">
           {renderOverlay()}
           
           <div className="grid grid-cols-3 md:grid-cols-4 gap-4 w-full max-w-3xl aspect-[4/3] md:aspect-auto">
             {screens.map((screen) => (
               <Monitor 
                 key={screen.id} 
                 id={screen.id} 
                 isOn={screen.isOn} 
                 characterSeed={screen.characterSeed}
                 onClick={handleMonitorClick}
                 onTimeout={handleMonitorTimeout}
                 duration={currentLevelConfig.duration}
                 isGameLost={gameState === GameState.LOST}
               />
             ))}
           </div>
        </main>

        <footer className="mt-4 text-center text-gray-600 text-xs">
          Level {level}. Target: {REQUIRED_HITS}/{TOTAL_SPAWNS}. Speed: {currentLevelConfig.spawnRate}ms.
        </footer>
      </div>
    </div>
  );
}
