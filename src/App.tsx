/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

type Point = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 };

const TRACKS = [
  { id: 1, title: "UPLINK_01.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "UPLINK_02.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "UPLINK_03.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

export default function App() {
  // Game State
  const [hasStarted, setHasStarted] = useState(false);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Music State
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const dirRef = useRef<Point>(INITIAL_DIRECTION);
  const lastProcessedDirRef = useRef<Point>(INITIAL_DIRECTION);

  // Audio Mute Control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Game Loop
  const speed = Math.max(60, 150 - Math.floor(score / 50) * 10);

  useEffect(() => {
    if (!hasStarted || gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const newDir = dirRef.current;
        lastProcessedDirRef.current = newDir;

        const newHead = { x: head.x + newDir.x, y: head.y + newDir.y };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          return prev;
        }

        // Self collision
        if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            setHighScore(hs => Math.max(hs, newScore));
            return newScore;
          });
          
          let newFood: Point;
          while (true) {
            newFood = {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE)
            };
            if (!newSnake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
          }
          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [hasStarted, gameOver, isPaused, food, speed]);

  // Keyboard Controls
  const changeDirection = useCallback((newDir: Point) => {
    const currentDir = lastProcessedDirRef.current;
    if (newDir.x !== 0 && currentDir.x === -newDir.x) return;
    if (newDir.y !== 0 && currentDir.y === -newDir.y) return;
    dirRef.current = newDir;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        setIsPaused(p => !p);
        return;
      }

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': changeDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': case 's': case 'S': changeDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': case 'a': case 'A': changeDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': case 'd': case 'D': changeDirection({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  // Game Actions
  const startGame = () => {
    setHasStarted(true);
    setIsPlaying(true);
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    dirRef.current = INITIAL_DIRECTION;
    lastProcessedDirRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
  };

  // Music Actions
  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrack]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrack((p) => (p + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrack((p) => (p - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="min-h-screen bg-black text-[#00FFFF] font-vt323 flex flex-col items-center justify-center p-4 overflow-hidden relative uppercase selection:bg-[#FF00FF] selection:text-black">
      <div className="static-noise"></div>
      <div className="scanline"></div>

      <audio
        ref={audioRef}
        src={TRACKS[currentTrack].url}
        onEnded={nextTrack}
      />

      {/* Header */}
      <div className="mb-8 text-center z-10 screen-tear w-full max-w-2xl">
        <h1 
          className="text-3xl md:text-5xl font-press-start text-[#FF00FF] mb-4 glitch"
          data-text="SYS.SNAKE_PROTOCOL"
        >
          SYS.SNAKE_PROTOCOL
        </h1>
        <div className="flex items-center justify-between border-2 border-[#00FFFF] p-2 bg-black text-2xl md:text-3xl">
          <div>DATA_YIELD: {score.toString().padStart(4, '0')}</div>
          <div className="text-[#FF00FF]">MAX_YIELD: {highScore.toString().padStart(4, '0')}</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative w-full max-w-[400px] aspect-square bg-black border-4 border-[#FF00FF] z-10" style={{ boxShadow: '8px 8px 0px #00FFFF' }}>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#00FFFF 1px, transparent 1px), linear-gradient(90deg, #00FFFF 1px, transparent 1px)', backgroundSize: '5% 5%' }}></div>

        {!hasStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <button
              onClick={startGame}
              className="px-6 py-4 border-2 border-[#00FFFF] text-[#00FFFF] text-3xl hover:bg-[#00FFFF] hover:text-black transition-none glitch"
              data-text="INITIATE_SEQUENCE"
            >
              INITIATE_SEQUENCE
            </button>
          </div>
        ) : (
          <>
            {/* Food */}
            <div
              className="absolute bg-[#FF00FF]"
              style={{ left: `${food.x * 5}%`, top: `${food.y * 5}%`, width: '5%', height: '5%' }}
            />
            {/* Snake */}
            {snake.map((segment, i) => (
              <div
                key={i}
                className={`absolute ${i === 0 ? 'bg-[#00FFFF]' : 'bg-[#00FFFF]/70'} border border-black`}
                style={{ left: `${segment.x * 5}%`, top: `${segment.y * 5}%`, width: '5%', height: '5%' }}
              />
            ))}

            {/* Overlays */}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                <h2 
                  className="text-3xl md:text-4xl font-press-start text-[#FF00FF] mb-8 glitch text-center leading-tight"
                  data-text="SYSTEM_FAILURE"
                >
                  SYSTEM_FAILURE
                </h2>
                <button
                  onClick={resetGame}
                  className="px-6 py-4 border-2 border-[#00FFFF] text-[#00FFFF] text-3xl hover:bg-[#00FFFF] hover:text-black transition-none"
                >
                  [ REBOOT_SYSTEM ]
                </button>
              </div>
            )}
            
            {isPaused && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                <h2 className="text-4xl font-press-start text-[#00FFFF] glitch" data-text="SYS.HALT">SYS.HALT</h2>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 mt-8 md:hidden z-10 w-full max-w-[200px]">
        <div />
        <button onClick={() => changeDirection({x: 0, y: -1})} className="border-2 border-[#00FFFF] text-[#00FFFF] p-4 text-2xl active:bg-[#00FFFF] active:text-black">[W]</button>
        <div />
        <button onClick={() => changeDirection({x: -1, y: 0})} className="border-2 border-[#00FFFF] text-[#00FFFF] p-4 text-2xl active:bg-[#00FFFF] active:text-black">[A]</button>
        <button onClick={() => changeDirection({x: 0, y: 1})} className="border-2 border-[#00FFFF] text-[#00FFFF] p-4 text-2xl active:bg-[#00FFFF] active:text-black">[S]</button>
        <button onClick={() => changeDirection({x: 1, y: 0})} className="border-2 border-[#00FFFF] text-[#00FFFF] p-4 text-2xl active:bg-[#00FFFF] active:text-black">[D]</button>
      </div>

      {/* Music Player */}
      <div className="mt-8 w-full max-w-[400px] bg-black border-2 border-[#00FFFF] p-4 z-10 screen-tear" style={{ animationDelay: '1.5s' }}>
        <div className="flex items-center justify-between mb-4 border-b-2 border-[#FF00FF] pb-2">
          <div className="truncate">
            <p className="text-xl text-[#FF00FF] animate-pulse">AUDIO_UPLINK_ACTIVE</p>
            <p className="text-3xl text-[#00FFFF] truncate">{TRACKS[currentTrack].title}</p>
          </div>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-3xl text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black px-2"
          >
            {isMuted ? '[ MUTED ]' : '[ VOL_ON ]'}
          </button>
        </div>
        
        <div className="flex items-center justify-between text-3xl">
          <button onClick={prevTrack} className="hover:bg-[#FF00FF] hover:text-black px-2 border border-transparent hover:border-[#FF00FF]">
            [ &lt;&lt; ]
          </button>
          <button 
            onClick={togglePlay} 
            className="px-4 py-2 border-2 border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black"
          >
            {isPlaying ? '[ PAUSE ]' : '[ PLAY ]'}
          </button>
          <button onClick={nextTrack} className="hover:bg-[#FF00FF] hover:text-black px-2 border border-transparent hover:border-[#FF00FF]">
            [ &gt;&gt; ]
          </button>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mt-8 text-center text-2xl text-[#FF00FF] z-10 hidden md:block border border-[#FF00FF] p-2">
        INPUT_REQ: [W][A][S][D] OR [ARROWS]. INTERRUPT: [SPACE].
      </div>
    </div>
  );
}
